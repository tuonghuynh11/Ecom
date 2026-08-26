import { randomInt } from 'crypto'
import { Prisma } from '../generated/prisma/client'

import path from 'path'
import envConfig from 'src/shared/config'
import { v4 as uuidv4 } from 'uuid'

export function isUniqueConstraintPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export function isNotFoundPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

export function isForeignKeyConstraintPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003'
}

export function generateOTP(length: number = 6): number {
  return randomInt(10 ** (length - 1), 10 ** length)
}

export function generateRandomFilename(originalFilename: string): string {
  const extension = path.extname(originalFilename)
  const uuid = uuidv4()
  return `${uuid}${extension}`
}

export function generateCancelPaymentJobId(paymentId: number): string {
  return `paymentId-${paymentId}`
}

export function createPaymentVietQR({ amount, content }: { amount: number; content: string }): string {
  const params = new URLSearchParams({
    bank: envConfig.BANK_NAME.toString(),
    acc: envConfig.BANK_ACCOUNT.toString(),
    amount: amount.toString(),
    des: content,
    template: 'compact',
  })

  return `https://vietqr.app/img?${params}`
}
