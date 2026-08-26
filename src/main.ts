import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import envConfig from 'src/shared/config'
import { WebsocketAdapter } from 'src/websockets/websocket.adapter'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const websocketAdapter = new WebsocketAdapter(app)
  await websocketAdapter.connectToRedis()

  app.setGlobalPrefix('api')
  app.enableCors({
    origin: '*',
  })
  app.useWebSocketAdapter(websocketAdapter)
  // app.useStaticAssets(UPLOAD_DIR, {
  //   prefix: '/media/static',
  // })

  await app.listen(envConfig.PORT ?? 3000)
}
bootstrap()
