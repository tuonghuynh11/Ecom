import { Injectable } from '@nestjs/common'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PaymentProducer } from 'src/routes/payment/payment.producer'
import { PaymentRepo } from 'src/routes/payment/payment.repo'
import { MessageResType } from 'src/shared/models/response.model'

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepo,
    private readonly paymentProducer: PaymentProducer,
  ) {}

  async receiver(body: WebhookPaymentBodyType): Promise<MessageResType> {
    const { message, paymentId } = await this.paymentRepo.receiver(body)
    await this.paymentProducer.removeJob(paymentId)
    return {
      message,
    }
  }
}
