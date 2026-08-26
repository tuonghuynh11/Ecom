import { Injectable } from '@nestjs/common'
import { parse } from 'date-fns'
import {
  CannotGetPaymentIdException,
  PaymentNotFoundException,
  PriceNotMatchException,
  TransactionAlreadyExistsException,
} from 'src/routes/payment/payment.error'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PaymentProducer } from 'src/routes/payment/payment.producer'
import { OrderStatus } from 'src/shared/constants/order.constant'
import { PaymentStatus } from 'src/shared/constants/payment.constant'
import { OrderIncludeProductSKUSnapshotType } from 'src/shared/models/shared-order.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class PaymentRepo {
  constructor(
    private readonly prisma: PrismaService,

    private readonly paymentProducer: PaymentProducer,
  ) {}

  private getTotalPrice(orders: OrderIncludeProductSKUSnapshotType[]): number {
    return orders.reduce((totalPrice, productSKU) => {
      const price = productSKU.items.reduce((itemTotal, item) => itemTotal + item.skuPrice * item.quantity, 0)
      return totalPrice + price
    }, 0)
  }

  async receiver(body: WebhookPaymentBodyType): Promise<number> {
    // 1. Thêm thông tin thanh toán vào bảng PaymentTransaction
    // Tham khảo: https://docs.sepay.vn/lap-trinh-webhooks.html
    let amountIn = 0
    let amountOut = 0
    if (body.transferType === 'in') {
      amountIn = body.transferAmount
    } else {
      amountOut = body.transferAmount
    }

    const paymentTransaction = await this.prisma.paymentTransaction.findUnique({
      where: {
        id: body.id,
      },
    })

    if (paymentTransaction) {
      throw TransactionAlreadyExistsException(body.id)
    }

    const userId = await this.prisma.$transaction(async (tx) => {
      const createPaymentTransaction$ = tx.paymentTransaction.create({
        data: {
          id: body.id,
          gateway: body.gateway,
          transactionDate: parse(body.transactionDate, 'yyyy-MM-dd HH:mm:ss', new Date()),
          accountNumber: body.accountNumber,
          subAccount: body.subAccount,
          amountIn,
          amountOut,
          accumulated: body.accumulated,
          code: body.code,
          transactionContent: body.content,
          referenceNumber: body.referenceCode,
          body: body.description,
        },
      })

      // 2. Kiểm tra nội dung chuyển khoản và tổng số tiền của transaction có khớp với số tiền của order không
      const paymentId = body.code ? Number(body.code.split('DH')[1]) : Number(body.content?.split('DH')[1])

      if (isNaN(paymentId)) {
        throw CannotGetPaymentIdException
      }

      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          orders: {
            include: {
              items: true,
            },
          },
        },
      })

      if (!payment) {
        throw PaymentNotFoundException(paymentId)
      }

      const userId = payment.orders[0]?.userId
      const { orders } = payment

      const totalPrice = this.getTotalPrice(orders)

      if (totalPrice !== body.transferAmount) {
        throw PriceNotMatchException(totalPrice, body.transferAmount)
      }
      // 3. Nếu khớp thì cập nhật trạng thái:
      //    + Order thành "PENDING_PICKUP"
      //    + Payment thành "SUCCESS"

      const payment$ = tx.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status: PaymentStatus.SUCCESS,
        },
      })
      const order$ = tx.order.updateMany({
        where: {
          id: {
            in: orders.map((order) => order.id),
          },
        },
        data: {
          status: OrderStatus.PENDING_PICKUP,
        },
      })
      const removeJob$ = this.paymentProducer.removeJob(paymentId)
      await Promise.all([createPaymentTransaction$, payment$, order$, removeJob$])
      return userId
    })

    return userId
  }
}
