import { createZodDto } from 'nestjs-zod'
import { PaymentTransactionSchema, WebhookPaymentBodySchema } from 'src/routes/payment/payment.model'

export class PaymentTransactionDTO extends createZodDto(PaymentTransactionSchema) {}
export class WebhookPaymentBodyDTO extends createZodDto(WebhookPaymentBodySchema) {}
