import { createZodDto } from 'nestjs-zod'
import { GetUserProfileResSchema, UpdateProfileResSchema } from 'src/shared/models/shared-user.model'

// Apply for Response of GET ('profile') and GET ('users/:id')
export class GetUserProfileResDto extends createZodDto(GetUserProfileResSchema) {}

// Apply for Response of PUT ('profile') and PUT ('users/:id')

export class UpdateProfileResDto extends createZodDto(UpdateProfileResSchema) {}
