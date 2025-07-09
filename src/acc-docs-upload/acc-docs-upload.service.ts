import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataManagementClient } from '@aps_sdk/data-management';
import { AuthService } from '../auth/auth.service';
import axios from 'axios';

@Injectable()
export class AccDocsUploadService {
  private dataManagementClient = new DataManagementClient();

  constructor(private readonly authService: AuthService) {}

  /**
   * Step 1: Initialize upload session and return sessionId (storage object ID).
   */
  async initUpload(
    apsUserId: string,
    fileName: string,
    projectId: string,
    folderId: string
  ): Promise<{ sessionId: string; storageUrn: string }> {
    const user = await this.authService.refreshUserTokens(apsUserId);
    console.log("user : " , user);
    if (!user || !user.accessToken) throw new UnauthorizedException('Login required');

    const body = {
      jsonapi: { version: '1.0' as '1.0' },
      data: {
        type: 'objects' as 'objects',
        attributes: { name: fileName },
        relationships: {
          target: {
            data: {
              type: 'folders' as 'folders',
              id: folderId,
            },
          },
        },
      },
    };

    // createStorage(projectId, body, opts) is correct; remove folderId
    const resp = await this.dataManagementClient.createStorage(
      projectId,
      body,
      { accessToken: user.accessToken }
    );
    console.log("resp : " , resp);
    const storageUrn = resp.data.id;
    console.log("storageUrn : " , storageUrn);
    return { sessionId: storageUrn, storageUrn };
  }

  /**
   * Step 2: Upload file (binary) and finalize the process.
   */
  async uploadFile(
    apsUserId: string,
    sessionId: string, // storage object ID (URN)
    fileBuffer: Buffer
  ): Promise<any> {
    const user = await this.authService.refreshUserTokens(apsUserId);
    if (!user || !user.accessToken) throw new UnauthorizedException('Login required');

    // Parse storage URN to get bucketKey and objectKey
    const match = sessionId.match(/urn:adsk\.objects:os.object:([^\/]+)\/(.+)/);
    if (!match) throw new Error('Invalid storage URN');
    const bucketKey = match[1];
    const objectKey = match[2];

    // APS OSS endpoint
    const url = `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}`;

    // Upload the file using HTTP PUT
    const resp = await axios.put(url, fileBuffer, {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return resp.data;
  }
} 