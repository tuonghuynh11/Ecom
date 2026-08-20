import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import * as path from 'path'
import { BrandTranslationModule } from 'src/routes/brand/brand-translation/brand-translation.module'
import { BrandModule } from 'src/routes/brand/brand.module'
import { CategoryTranslationModule } from 'src/routes/category/category-translation/category-translation.module'
import { CategoryModule } from 'src/routes/category/category.module'
import { LanguageModule } from 'src/routes/languages/languages.module'
import { MediaModule } from 'src/routes/media/media.module'
import { PermissionsModule } from 'src/routes/permissions/permissions.module'
import { ProfileModule } from 'src/routes/profile/profile.module'
import { RolesModule } from 'src/routes/roles/roles.module'
import { UserModule } from 'src/routes/user/user.module'
import { HttpExceptionFilter } from 'src/shared/filters/http-exception.filter'
import CustomZodValidationPipe from 'src/shared/pipes/custom-zod-validation.pipe'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './routes/auth/auth.module'
import { SharedModule } from './shared/shared.module'
@Module({
  imports: [
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
  ],
})
export class AppModule {}
