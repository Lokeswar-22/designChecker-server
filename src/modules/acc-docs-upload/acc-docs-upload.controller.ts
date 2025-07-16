import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccDocsUploadService } from './acc-docs-upload.service';

@Controller('acc-docs-upload')
export class AccDocsUploadController {
  constructor(private readonly svc: AccDocsUploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Body('accUserId') accUserId: string,
    @Body('projectId') projectId: string,
    @Body('hubId') hubId: string,
    @Body('folderId') folderId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.svc.prepareUpload(accUserId, projectId, hubId, folderId, file);
    const complete = await this.svc.uploadChunks(accUserId, file);
    const result = await this.svc.finalize(accUserId, projectId, folderId);
    return { complete, result };
  }
}
