import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import envConfig from 'src/shared/config'
import { WebsocketAdapter } from 'src/websockets/websocket.adapter'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const websocketAdapter = new WebsocketAdapter(app)
  await websocketAdapter.connectToRedis()

  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('The API for the E-commerce application')
    .setVersion('1.0')
    .build()
  const documentFactory = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-docs', app, cleanupOpenApiDoc(documentFactory), {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  app.setGlobalPrefix('api')
  app.enableCors({
    origin: '*',
  })
  app.useWebSocketAdapter(websocketAdapter)

  await app.listen(envConfig.PORT ?? 3000)
}
bootstrap()
