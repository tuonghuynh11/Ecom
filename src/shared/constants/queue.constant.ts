export const QUEUE_NAME = {
  PAYMENT_QUEUE: 'payment',
} as const

export const JOB_NAME = {
  CANCEL_PAYMENT_JOB: 'cancel-payment',
} as const

export type QUEUE_NAME = (typeof QUEUE_NAME)[keyof typeof QUEUE_NAME]
export type JOB_NAME = (typeof JOB_NAME)[keyof typeof JOB_NAME]
