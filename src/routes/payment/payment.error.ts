import { BadRequestException, NotFoundException } from '@nestjs/common'

export const CannotGetPaymentIdException = new BadRequestException('Cannot get paymentId from request')
export const PaymentNotFoundException = (id: number) => new NotFoundException(`Payment not found with id ${id}`)
export const PriceNotMatchException = (totalPrice: number, transferAmount: number) =>
  new BadRequestException(`Price not match, expected ${totalPrice} but got ${transferAmount} `)

export const TransactionAlreadyExistsException = (id: number) =>
  new BadRequestException(`Payment transaction with id ${id} already exists.`)
