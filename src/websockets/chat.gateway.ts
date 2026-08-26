import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'
@WebSocketGateway({
  namespace: 'chat',
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server

  @SubscribeMessage('send-message')
  handleEvent(@MessageBody() data: string): string {
    console.log('Socket Data: ', data)

    this.server.emit('receive-message', {
      message: 'Hello from server',
    })
    return data
  }
}
