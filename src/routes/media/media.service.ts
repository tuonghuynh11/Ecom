import { Injectable } from '@nestjs/common'
import { unlink } from 'fs/promises'
import { S3Service } from 'src/shared/services/s3.service'

@Injectable()
export class MediaService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFile(files: Array<Express.Multer.File>) {
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          return this.s3Service
            .uploadFile({
              filename: 'images/' + file.filename,
              filepath: file.path,
              contentType: file.mimetype,
            })
            .then((res) => {
              return {
                url: res.Location,
              }
            })
            .catch((err) => {
              throw err
            })
        }),
      )

      return results
    } finally {
      await Promise.all(
        files.map(async (file) => {
          await this.deleteFile(file.path)
        }),
      )
    }
  }

  async deleteFile(filepath: string) {
    return unlink(filepath)
  }
}
