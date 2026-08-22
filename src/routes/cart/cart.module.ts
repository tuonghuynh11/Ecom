import { Module } from '@nestjs/common'
import { CartController } from './cart.controller'
import { CartRepo } from './cart.repo'
import { CartService } from './cart.service'

@Module({
  providers: [CartService, CartRepo],
  controllers: [CartController],
})
export class CartModule {}
