import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import type { Response } from 'express'
import { ZodResponse } from 'nestjs-zod'
import path from 'path'
import { PresignedUploadFileBodyDTO, PresignedUploadFileResDTO, UploadFilesResDTO } from 'src/routes/media/media.dto'
import { FileNotFoundException } from 'src/routes/media/media.error'
import { MediaService } from 'src/routes/media/media.service'
import { ParseFilePipeWithUnlink } from 'src/routes/media/parse-file-pipe-with-unlink.pipe'
import { UPLOAD_DIR } from 'src/shared/constants/other.constant'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}
  @Post('images/upload')
  @ZodResponse({ type: UploadFilesResDTO })
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @IsPublic()
  uploadFile(
    @UploadedFiles(
      new ParseFilePipeWithUnlink({
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
    return this.mediaService.uploadFile(files)
  }

  @Get('static/:filename')
  @ApiBearerAuth()
  @ApiParam({ name: 'filename', type: String })
  serveFile(@Param('filename') file: string, @Res() res: Response) {
    return res.sendFile(path.resolve(`${UPLOAD_DIR}/${file}`), (err: Error) => {
      if (err) {
        res.status(FileNotFoundException.getStatus()).send(FileNotFoundException.getResponse())
      }
    })
  }

  @ZodResponse({ type: PresignedUploadFileResDTO })
  @Post('images/upload/presigned-url')
  @ApiBearerAuth()
  async createPresignedUrl(@Body() body: PresignedUploadFileBodyDTO) {
    return this.mediaService.getPresignedUrl(body)
  }
}
