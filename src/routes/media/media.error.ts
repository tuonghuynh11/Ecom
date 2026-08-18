import { NotFoundException } from '@nestjs/common'

export const FileNotFoundException = new NotFoundException('Error.FileNotFound')
