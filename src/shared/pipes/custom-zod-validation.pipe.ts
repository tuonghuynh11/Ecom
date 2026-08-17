import { UnprocessableEntityException } from '@nestjs/common'
import { createZodValidationPipe } from 'nestjs-zod'
import { ZodError } from 'zod'

const CustomZodValidationPipe = createZodValidationPipe({
  // provide custom validation exception factory
  createValidationException: (error: unknown) => {
    if (error instanceof ZodError) {
      return new UnprocessableEntityException(
        error.issues.map((issue) => {
          return {
            ...issue,
            path: issue.path.join('.'),
          }
        }),
      )
    }

    return new UnprocessableEntityException('Ooops')
  },
})

export default CustomZodValidationPipe
