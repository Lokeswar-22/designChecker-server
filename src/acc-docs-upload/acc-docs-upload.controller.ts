import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccDocsUploadService } from './acc-docs-upload.service';


@Controller('accdocs')
export class AccDocsUploadController {
  private readonly logger = new Logger(AccDocsUploadController.name);

  constructor(private readonly uploadService: AccDocsUploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRevitFile(
    @UploadedFile() file: any,
    @Body()
    body: {
      projectId: string;
      hubId: string;
      folderId: string;
      userId: string;
    },
  ) {
    const { projectId, hubId, folderId, userId } = body;
    const filename = file.originalname;

    this.logger.log(`Upload initiated for file: ${filename} by user: ${userId}`);

    // 1️⃣ Create storage object
    const storage = await this.uploadService.createStorageObject(
      projectId,
      folderId,
      filename,
      userId,
    );

    // 2️⃣ Generate signed URL
    const signed = await this.uploadService.generateSignedUrls(
      storage.bucketKey,
      storage.objectKey,
      userId,
    );

    // 3️⃣ Upload file directly to signed S3 URL
    await this.uploadService.uploadChunkToSignedUrl(signed.urls[0], file.buffer);

    // 4️⃣ Complete the upload on APS
    const result = await this.uploadService.completeUpload(
      storage.bucketKey,
      storage.objectKey,
      signed.uploadKey,
      userId,
    );

    this.logger.log(`Upload completed for file: ${filename}`);
    this.logger.debug(`APS Upload Details: ${JSON.stringify(result, null, 2)}`);

    return {
      message: 'File uploaded successfully to Autodesk APS.',
      apsObjectId: result.objectId,
      apsObjectKey: result.objectKey,
      apsLocation: result.location,
      apsBucketKey: result.bucketKey,
      fileSize: result.size,
      contentType: result.contentType,
    };
  }
}
