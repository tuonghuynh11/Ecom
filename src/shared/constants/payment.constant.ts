export const PaymentStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
}

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]
