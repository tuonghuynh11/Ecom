import { Module } from '@nestjs/common'
import { LanguageController } from 'src/routes/languages/languages.controller'
import { LanguageRepo } from 'src/routes/languages/languages.repo'
import { LanguageService } from 'src/routes/languages/languages.service'

@Module({
  providers: [LanguageService, LanguageRepo],
  controllers: [LanguageController],
})
export class LanguageModule {}
