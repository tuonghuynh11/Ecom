import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import envConfig from 'src/shared/config'
import { WebsocketAdapter } from 'src/websockets/websocket.adapter'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true })

  const websocketAdapter = new WebsocketAdapter(app)
  await websocketAdapter.connectToRedis()
  app.setGlobalPrefix('api')

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription(`The API for the E-commerce application`)
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      {
        name: 'authorization',
        type: 'apiKey',
        in: 'header',
      },
      'payment-api-key',
    )
    .build()
  const documentFactory = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-docs', app, cleanupOpenApiDoc(documentFactory), {
    jsonDocumentUrl: '/api-docs/openapi.json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  // Enable CORS for all origins
  app.enableCors({
    origin: '*',
  })

  // Trust proxy settings for Heroku
  app.set('trust proxy', 'loopback') // Trust requests from the loopback address
  app.use(helmet())
  app.useWebSocketAdapter(websocketAdapter)

  // Use the LoggingInterceptor globally
  // app.useGlobalInterceptors(new LoggingInterceptor())

  // Use the Logger from nestjs-pino globally
  app.useLogger(app.get(Logger))

  await app.listen(envConfig.PORT ?? 3000)

  console.info('Listening on port', envConfig.PORT ?? 3000)
}
bootstrap()
