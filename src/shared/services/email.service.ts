import { Injectable } from '@nestjs/common'
import OTPEmail from 'emails/otp'
import { render } from 'react-email'
import { Resend } from 'resend'
import envConfig from 'src/shared/config'

@Injectable()
export class EmailService {
  private readonly resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }
  async sendOTP(payload: { email: string; code: string }) {
    const subject = 'Mã OTP'
    const html = await render(
      OTPEmail({
        otpCode: payload.code,
        title: subject,
      }),
      {
        pretty: true,
      },
    )
    return this.resend.emails.send({
      from: 'Nest.js Ecommerce <no-reply@manhtuong.id.vn>',
      to: [payload.email],
      subject,
      html: html,
      // react: OTPEmail({
      //   otpCode: payload.code,
      //   title: subject,
      // }),
    })
  }
}
