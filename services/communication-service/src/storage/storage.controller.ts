import { Controller, Get, Param, Res, Logger, NotFoundException } from '@nestjs/common';
import { MinioService } from './minio.service';
import { Response } from 'express';

@Controller('files')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly minioService: MinioService) {}

  @Get(':folder/:fileName')
  async getFile(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    try {
      const objectName = `${folder}/${fileName}`;
      const stream = await this.minioService.getFileStream(objectName);
      res.setHeader('Cache-Control', 'max-age=31536000');
      stream.pipe(res);
    } catch (error) {
      this.logger.error(`Error serving file ${folder}/${fileName}: ${error}`);
      throw new NotFoundException('File not found');
    }
  }
}
