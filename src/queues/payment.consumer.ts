import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { PaymentJobDataType } from 'src/queues/data.type'
import { JOB_NAME, QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { SharedPaymentRepository } from 'src/shared/repositories/shared-payment.repo'

@Processor(QUEUE_NAME.PAYMENT_QUEUE)
export class PaymentConsumer extends WorkerHost {
  constructor(private readonly sharedPaymentRepository: SharedPaymentRepository) {
    super()
  }
  async process(job: Job<PaymentJobDataType, any, string>): Promise<any> {
    switch (job.name) {
      case JOB_NAME.CANCEL_PAYMENT_JOB: {
        const { paymentId } = job.data
        await this.sharedPaymentRepository.cancelPaymentAndOrder(paymentId)
        return {}
      }
      default: {
        break
      }
    }
  }
}
