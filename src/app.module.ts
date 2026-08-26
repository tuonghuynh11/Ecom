import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import ms from 'ms'
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import * as path from 'path'
import { PaymentConsumer } from 'src/queues/payment.consumer'
import { BrandTranslationModule } from 'src/routes/brand/brand-translation/brand-translation.module'
import { BrandModule } from 'src/routes/brand/brand.module'
import { CartModule } from 'src/routes/cart/cart.module'
import { CategoryTranslationModule } from 'src/routes/category/category-translation/category-translation.module'
import { CategoryModule } from 'src/routes/category/category.module'
import { LanguageModule } from 'src/routes/languages/languages.module'
import { MediaModule } from 'src/routes/media/media.module'
import { OrderModule } from 'src/routes/order/order.module'
import { PaymentModule } from 'src/routes/payment/payment.module'
import { PermissionsModule } from 'src/routes/permissions/permissions.module'
import { ProductTranslationModule } from 'src/routes/product/product-translation/product-translation.module'
import { ProductModule } from 'src/routes/product/product.module'
import { ProfileModule } from 'src/routes/profile/profile.module'
import { RolesModule } from 'src/routes/roles/roles.module'
import { UserModule } from 'src/routes/user/user.module'
import envConfig from 'src/shared/config'
import { HttpExceptionFilter } from 'src/shared/filters/http-exception.filter'
import { ThrottlerBehindProxyGuard } from 'src/shared/guards/throttler-behind-proxy.guard'
import CustomZodValidationPipe from 'src/shared/pipes/custom-zod-validation.pipe'
import { WebsocketModule } from 'src/websockets/websocket.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './routes/auth/auth.module'
import { SharedModule } from './shared/shared.module'
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: envConfig.REDIS_URL,
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'long',
          ttl: ms('1m'), // 1 minute
          limit: 10, // 10 requests per minute
        },
        {
          name: 'medium',
          ttl: ms('30s'), // 30 seconds
          limit: 5, // 5 requests per 30 seconds
        },
        {
          name: 'short',
          ttl: ms('10s'), // 10 seconds
          limit: 2, // 2 requests per 10 seconds
        },
      ],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.resolve('src/i18n/'),
        watch: true,
      },
      typesOutputPath: path.resolve('src/generated/i18n.generated.ts'),
      // Priority QueryResolver: Has "lang" query parameter,
      // AcceptLanguageResolver: Has "Accept-Language" header
      resolvers: [{ use: QueryResolver, options: ['lang'] }, AcceptLanguageResolver],
    }),
    SharedModule,
    AuthModule,
    LanguageModule,
    PermissionsModule,
    RolesModule,
    ProfileModule,
    UserModule,
    MediaModule,
    BrandModule,
    BrandTranslationModule,
    CategoryModule,
    CategoryTranslationModule,
    ProductModule,
    ProductTranslationModule,
    CartModule,
    OrderModule,
    PaymentModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    PaymentConsumer,
  ],
})
export class AppModule {}
