import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { PaymentController } from 'src/routes/payment/payment.controller'
import { PaymentProducer } from 'src/routes/payment/payment.producer'
import { PaymentRepo } from 'src/routes/payment/payment.repo'
import { PaymentService } from 'src/routes/payment/payment.service'
import { QUEUE_NAME } from 'src/shared/constants/queue.constant'

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAME.PAYMENT_QUEUE,
    }),
  ],
  providers: [PaymentService, PaymentRepo, PaymentProducer],
  controllers: [PaymentController],
})
export class PaymentModule {}
