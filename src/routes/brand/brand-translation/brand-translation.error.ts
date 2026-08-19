import { UnprocessableEntityException } from '@nestjs/common'

export const BrandTranslationAlreadyExistsException = new UnprocessableEntityException([
  {
    path: 'languageId',
    message: 'Error.BrandTranslationAlreadyExists',
  },
])

export const BrandTranslationLanguageOrBrandNotFoundException = new UnprocessableEntityException([
  {
    path: 'languageId',
    message: 'Error.BrandTranslationLanguageOrBrandNotFound',
  },
  {
    path: 'brandId',
    message: 'Error.BrandTranslationLanguageOrBrandNotFound',
  },
])
