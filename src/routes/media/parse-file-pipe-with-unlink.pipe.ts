import { ParseFilePipe } from '@nestjs/common'
import { unlink } from 'fs/promises'

export class ParseFilePipeWithUnlink extends ParseFilePipe {
  constructor(options?: any) {
    super(options)
  }

  async transform(files: Array<Express.Multer.File>): Promise<any> {
    return super.transform(files).catch(async (error) => {
      // Unlink the files if validation fails
      await Promise.all(
        files.map((file) => {
          return unlink(file.path)
        }),
      )
      throw error
    })
  }
}
