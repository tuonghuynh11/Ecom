import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import { LanguageModule } from 'src/routes/languages/languages.module'
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
  imports: [SharedModule, AuthModule, LanguageModule, PermissionsModule, RolesModule, ProfileModule, UserModule],
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
