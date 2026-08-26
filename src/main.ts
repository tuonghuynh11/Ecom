import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import envConfig from 'src/shared/config'
import { WebsocketAdapter } from 'src/websockets/websocket.adapter'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: '*',
  })
  app.useWebSocketAdapter(new WebsocketAdapter(app))
  // app.useStaticAssets(UPLOAD_DIR, {
  //   prefix: '/media/static',
  // })

  await app.listen(envConfig.PORT ?? 3000)
}
bootstrap()
