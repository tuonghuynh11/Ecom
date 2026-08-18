import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { existsSync, mkdirSync } from 'fs'
import multer from 'multer'
import { MediaController } from 'src/routes/media/media.controller'
import { MediaService } from 'src/routes/media/media.service'
import { UPLOAD_DIR } from 'src/shared/constants/other.constant'
import { generateRandomFilename } from 'src/shared/helpers'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    const newFileName = generateRandomFilename(file.originalname)
    cb(null, newFileName)
  },
})

@Module({
  imports: [
    MulterModule.register({
      storage,
    }),
  ],
  providers: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {
  constructor() {
    if (existsSync(UPLOAD_DIR) === false) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }
  }
}
