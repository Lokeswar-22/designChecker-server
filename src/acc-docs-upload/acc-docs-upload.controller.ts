import { Controller, Post, Body, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccDocsUploadService } from './acc-docs-upload.service';
import { File as MulterFile } from 'multer';

@Controller('acc-docs-upload')
export class AccDocsUploadController {
  constructor(private readonly accDocsUploadService: AccDocsUploadService) {}

  @Post('init')
  async initUpload(
    @Query('apsUserId') apsUserId: string,
    @Body('fileName') fileName: string,
    @Body('projectId') projectId: string,
    @Body('folderId') folderId: string,
  ) {
    return this.accDocsUploadService.initUpload(apsUserId, fileName, projectId, folderId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Query('apsUserId') apsUserId: string,
    @Body('sessionId') sessionId: string,
    @UploadedFile() file: MulterFile,
  ) {
    return this.accDocsUploadService.uploadFile(apsUserId, sessionId, file.buffer);
  }
} 