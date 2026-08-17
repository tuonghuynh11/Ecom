import { createZodDto } from 'nestjs-zod'
import { EmptyBodySchema } from 'src/shared/models/request.model'

export class EmptyBodyDto extends createZodDto(EmptyBodySchema) {}
