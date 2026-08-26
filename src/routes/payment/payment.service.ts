import { Injectable } from '@nestjs/common'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PaymentRepo } from 'src/routes/payment/payment.repo'
import { SharedWebsocketRepository } from 'src/shared/repositories/shared-websocket.repo'

@WebSocketGateway({
  namespace: 'payment',
})
@Injectable()
export class PaymentService {
  @WebSocketServer()
  server!: Server
  constructor(
    private readonly paymentRepo: PaymentRepo,

    private readonly sharedWebsocketRepository: SharedWebsocketRepository,
  ) {}

  async receiver(body: WebhookPaymentBodyType) {
    const userID = await this.paymentRepo.receiver(body)
    try {
      const websockets = await this.sharedWebsocketRepository.findByUserId(userID)
      websockets.forEach((ws) => {
        this.server.to(ws.id).emit('payment', {
          status: 'success',
        })
      })
      console.info(`Payment notification sent to user ${userID} via websockets.`)
    } catch (error) {
      console.error('Error sending payment notification (websocket):', error)
    }
    return {
      message: 'Payment received successfully',
    }
  }
}
