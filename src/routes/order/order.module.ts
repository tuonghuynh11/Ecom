import { Module } from '@nestjs/common'
import { OrderController } from 'src/routes/order/order.controller'
import { OrderRepo } from './order.repo'
import { OrderService } from './order.service'

@Module({
  providers: [OrderService, OrderRepo],
  controllers: [OrderController],
})
export class OrderModule {}
