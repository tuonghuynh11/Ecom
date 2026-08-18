import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import path from 'path'
import { FileNotFoundException } from 'src/routes/media/media.error'
import envConfig from 'src/shared/config'
import { UPLOAD_DIR } from 'src/shared/constants/other.constant'

@Controller('media')
export class MediaController {
  @Post('images/upload')
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadFile(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024, // 5MB
          }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/, skipMagicNumbersValidation: true }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    console.log(files)

    return files.map((file) => ({
      url: `${envConfig.PREFIX_STATIC_ENDPOINT}/${file.filename}`,
    }))
  }

  @Get('static/:filename')
  serveFile(@Param('filename') file: string, @Res() res: Response) {
    return res.sendFile(path.resolve(`${UPLOAD_DIR}/${file}`), (err: Error) => {
      if (err) {
        res.status(FileNotFoundException.getStatus()).send(FileNotFoundException.getResponse())
      }
    })
  }
}
