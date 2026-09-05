import KeyvRedis from '@keyv/redis'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { BullModule } from '@nestjs/bullmq'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { GraphQLModule } from '@nestjs/graphql'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'
import { randomUUID } from 'crypto'
import ms from 'ms'
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n'
import { LoggerModule } from 'nestjs-pino'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import * as path from 'path'
import { RemoveRefreshTokenCronjob } from 'src/cronjobs/remove-refresh-token.cronjob'
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
import { ReviewModule } from 'src/routes/review/review.module'
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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: path.join('src/schema.gql'),
      // formatError(error) {
      //   const { stacktrace, ...restExtension } = error.extensions ?? {}
      //   return {
      //     ...error,
      //     extensions: restExtension,
      //   }
      // },
      context: ({ req, res }) => ({ req, res }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

        genReqId: (req, res) => {
          const requestId = req.headers['x-request-id']?.toString() ?? randomUUID()

          res.setHeader('x-request-id', requestId)

          return requestId
        },

        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,

            // chỉ hiện khi có giá trị thực sự cần thiết
            params: req.params && Object.keys(req.params).length > 0 ? req.params : undefined,

            query: req.query && Object.keys(req.query).length > 0 ? req.query : undefined,
          }),

          res: (res) => ({
            statusCode: res.statusCode,
          }),

          err: (err) => ({
            type: err.type,
            message: err.message,
            stack: err.stack,
          }),
        },

        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) {
            return 'error'
          }

          if (res.statusCode >= 400) {
            return 'warn'
          }

          return 'info'
        },

        customSuccessMessage: (req, res) => {
          return `${req.method} ${req.url} ${res.statusCode}`
        },

        customErrorMessage: (req, res, err) => {
          return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`
        },

        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',

            'req.body.password',
            'req.body.passwordConfirm',

            'req.body.accessToken',
            'req.body.refreshToken',

            'req.body.token',
            'req.body.otp',

            'res.headers["set-cookie"]',
          ],

          censor: '[REDACTED]',
        },

        transport: {
          targets:
            process.env.NODE_ENV !== 'production'
              ? [
                  // Terminal
                  {
                    target: 'pino-pretty',
                    level: 'debug',

                    options: {
                      colorize: true,
                      translateTime: 'SYS:standard',

                      singleLine: false,

                      ignore: 'pid,hostname',

                      messageFormat: '{msg}',
                    },
                  },

                  // File
                  {
                    target: 'pino/file',
                    level: 'info',

                    options: {
                      destination: path.resolve('logs/app.log'),
                      mkdir: true,
                    },
                  },
                ]
              : [
                  // File
                  {
                    target: 'pino/file',
                    level: 'info',

                    options: {
                      destination: path.resolve('logs/app.log'),
                      mkdir: true,
                    },
                  },
                ],
        },
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        return {
          stores: [new KeyvRedis(envConfig.REDIS_URL)],
        }
      },
    }),
    BullModule.forRoot({
      connection: {
        url: envConfig.REDIS_URL,
      },
    }),
    ScheduleModule.forRoot(),
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
    ReviewModule,
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
    RemoveRefreshTokenCronjob,
  ],
})
export class AppModule {}
