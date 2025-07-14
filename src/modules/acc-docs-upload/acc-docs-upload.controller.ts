import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccDocsUploadService } from './acc-docs-upload.service';

@Controller('accdocs')
export class AccDocsUploadController {

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


    const documentId = await this.uploadService.createDocumentRecord(
      file,
      projectId,
      hubId,
      folderId,
    );

    try {
      const storage = await this.uploadService.createStorageObject(
        projectId,
        folderId,
        filename,
        userId,
      );

      const signed = await this.uploadService.generateSignedUrls(
        storage.bucketKey,
        storage.objectKey,
        userId,
      );

      await this.uploadService.uploadChunkToSignedUrl(signed.urls[0], file.buffer);

      const result = await this.uploadService.completeUpload(
        storage.bucketKey,
        storage.objectKey,
        signed.uploadKey,
        userId,
      );

      await this.uploadService.updateDocumentAsAccDoc(documentId, storage.objectId);


      return {
        message: 'File uploaded successfully to Autodesk APS.',
        documentId,
        apsObjectId: result.objectId,
        apsObjectKey: result.objectKey,
        apsLocation: result.location,
        apsBucketKey: result.bucketKey,
        fileSize: result.size,
        contentType: result.contentType,
      };
    } catch (error) {
      throw error;
    }
  }
}
