import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { OrderController } from 'src/routes/order/order.controller'
import { OrderProducer } from 'src/routes/order/order.producer'
import { QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { OrderRepo } from './order.repo'
import { OrderService } from './order.service'

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAME.PAYMENT_QUEUE,
    }),
  ],
  providers: [OrderService, OrderRepo, OrderProducer],
  controllers: [OrderController],
})
export class OrderModule {}
