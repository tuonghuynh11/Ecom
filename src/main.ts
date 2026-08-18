import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import envConfig from 'src/shared/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: '*',
  })

  // app.useStaticAssets(UPLOAD_DIR, {
  //   prefix: '/media/static',
  // })

  await app.listen(envConfig.PORT ?? 3000)
}
bootstrap()
