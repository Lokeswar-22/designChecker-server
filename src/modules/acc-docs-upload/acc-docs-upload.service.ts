import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from '../auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AccDocsUploadService {
  private readonly logger = new Logger(AccDocsUploadService.name);

  private readonly APS_BASE = 'https://developer.api.autodesk.com';
  private readonly DATA_BASE = `${this.APS_BASE}/data/v1/projects`;
  private readonly OSS_BASE = `${this.APS_BASE}/oss/v2/buckets`;

  constructor(private readonly authService: AuthService) {}

  async createStorageObject(
    projectId: string,
    folderId: string,
    filename: string,
    apsUserId: string,
  ): Promise<{ bucketKey: string; objectKey: string; objectId: string }> {
    const user = await this.authService.refreshUserTokens(apsUserId);
    if (!user || !user.accessToken) {
      throw new UnauthorizedException('Login required');
    }

    const url = `${this.DATA_BASE}/${projectId}/storage`;
    const payload = {
      jsonapi: { version: '1.0' },
      data: {
        type: 'objects',
        attributes: { name: filename },
        relationships: {
          target: { data: { type: 'folders', id: folderId } },
        },
      },
    };

    const { data } = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
    });

    const urn = data.data.id;
    const [, , bucketKey, objectKey] = urn.split(':').pop().split('/');

    this.logger.log(`Storage created: bucketKey=${bucketKey}, objectKey=${objectKey}`);
    return { bucketKey, objectKey, objectId: urn };
  }

  async generateSignedUrls(
    bucketKey: string,
    objectKey: string,
    apsUserId: string,
  ): Promise<{ uploadKey: string; urls: string[] }> {
    const user = await this.authService.refreshUserTokens(apsUserId);
    if (!user || !user.accessToken) {
      throw new UnauthorizedException('Login required');
    }

    const url = `${this.OSS_BASE}/${bucketKey}/objects/${objectKey}/signeds3upload`;

    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    this.logger.log(`Signed URLs generated for objectKey=${objectKey}`);
    return { uploadKey: data.uploadKey, urls: data.urls };
  }

  async uploadChunkToSignedUrl(
    signedUrl: string,
    fileBuffer: Buffer,
  ): Promise<void> {
    const { status } = await axios.put(signedUrl, fileBuffer, {
      headers: { 'Content-Type': 'application/octet-stream' },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (status !== 200) {
      throw new Error(`Failed to upload chunk. Status: ${status}`);
    }
  }

  async completeUpload(
    bucketKey: string,
    objectKey: string,
    uploadKey: string,
    apsUserId: string,
  ) {
    const user = await this.authService.refreshUserTokens(apsUserId);
    if (!user || !user.accessToken) {
      throw new UnauthorizedException('Login required');
    }

    const url = `${this.OSS_BASE}/${bucketKey}/objects/${objectKey}/signeds3upload`;

    const { data } = await axios.post(
      url,
      { uploadKey },
      { headers: { Authorization: `Bearer ${user.accessToken}` } },
    );

    this.logger.log(`Upload completed for objectKey=${objectKey}`);
    this.logger.debug(`Final Object Info: ${JSON.stringify(data, null, 2)}`);

    return data;
  }
}
