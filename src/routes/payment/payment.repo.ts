import { Injectable } from '@nestjs/common'
import { parse } from 'date-fns'
import {
  CannotGetPaymentIdException,
  PaymentNotFoundException,
  PriceNotMatchException,
} from 'src/routes/payment/payment.error'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { OrderStatus } from 'src/shared/constants/order.constant'
import { PaymentStatus } from 'src/shared/constants/payment.constant'
import { MessageResType } from 'src/shared/models/response.model'
import { OrderIncludeProductSKUSnapshotType } from 'src/shared/models/shared-order.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class PaymentRepo {
  constructor(private readonly prisma: PrismaService) {}

  private getTotalPrice(orders: OrderIncludeProductSKUSnapshotType[]): number {
    return orders.reduce((totalPrice, productSKU) => {
      const price = productSKU.items.reduce((itemTotal, item) => itemTotal + item.skuPrice * item.quantity, 0)
      return totalPrice + price
    }, 0)
  }

  async receiver(body: WebhookPaymentBodyType): Promise<MessageResType> {
    // 1. Thêm thông tin thanh toán vào bảng PaymentTransaction
    // Tham khảo: https://docs.sepay.vn/lap-trinh-webhooks.html
    let amountIn = 0
    let amountOut = 0
    if (body.transferType === 'in') {
      amountIn = body.transferAmount
    } else {
      amountOut = body.transferAmount
    }

    await this.prisma.paymentTransaction.create({
      data: {
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

    const payment = await this.prisma.payment.findUnique({
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
    const { orders } = payment

    const totalPrice = this.getTotalPrice(orders)

    if (totalPrice !== body.transferAmount) {
      // Nếu không khớp thì cập nhật trạng thái:
      //    + Payment thành "FAILED"
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.FAILED },
      })
      throw PriceNotMatchException(totalPrice, body.transferAmount)
    }
    // 3. Nếu khớp thì cập nhật trạng thái:
    //    + Order thành "PENDING_PICKUP"
    //    + Payment thành "SUCCESS"

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status: PaymentStatus.SUCCESS,
        },
      }),
      this.prisma.order.updateMany({
        where: {
          id: {
            in: orders.map((order) => order.id),
          },
        },
        data: {
          status: OrderStatus.PENDING_PICKUP,
        },
      }),
    ])

    return { message: 'Payment success' }
  }
}
