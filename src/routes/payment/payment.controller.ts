import { Body, Controller, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { WebhookPaymentBodyDTO } from 'src/routes/payment/payment.dto'
import { PaymentService } from 'src/routes/payment/payment.service'
import { AuthType } from 'src/shared/constants/auth.constant'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { MessageResDto } from 'src/shared/dtos/response.dto'

@Controller('payment')
@ApiBearerAuth()
@ApiSecurity('payment-api-key')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/receiver')
  @ZodResponse({ type: MessageResDto })
  @Auth([AuthType.PaymentAPIKey])
  receiver(@Body() body: WebhookPaymentBodyDTO) {
    return this.paymentService.receiver(body)
  }
}
