import { Injectable } from '@nestjs/common'
import { unlink } from 'fs/promises'
import { PresignedUploadFileBodyType } from 'src/routes/media/media.model'
import { generateRandomFilename } from 'src/shared/helpers'
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

      return {
        data: results,
      }
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

  async getPresignedUrl(body: PresignedUploadFileBodyType) {
    const randomFilename = generateRandomFilename(body.filename)
    const presignedUrl = await this.s3Service.createPresignedUrlWithClient('images/' + randomFilename)

    const url = presignedUrl.split('?')[0]

    return { presignedUrl, url }
  }
}
