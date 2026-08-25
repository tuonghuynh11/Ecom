import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'
import ms from 'ms'
import { JOB_NAME, QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { generateCancelPaymentJobId } from 'src/shared/helpers'

@Injectable()
export class OrderProducer {
  constructor(@InjectQueue(QUEUE_NAME.PAYMENT_QUEUE) private paymentQueue: Queue) {}

  async cancelPaymentJob(paymentId: number) {
    return this.paymentQueue.add(
      JOB_NAME.CANCEL_PAYMENT_JOB,
      { paymentId },
      {
        delay: ms('24h'), // 24 hours
        jobId: generateCancelPaymentJobId(paymentId),
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
  }
}
