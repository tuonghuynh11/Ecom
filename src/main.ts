import { NestFactory } from '@nestjs/core'
import envConfig from 'src/shared/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: '*',
  })
  await app.listen(envConfig.PORT ?? 3000)
}
bootstrap()
