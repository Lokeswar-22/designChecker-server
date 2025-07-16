import { Injectable, StreamableFile } from '@nestjs/common';
import axios from 'axios';
import * as rax from 'retry-axios';
import { ACCAuthService } from '../acc-auth/acc-auth.service';

interface CacheEntry {
  name: string;
  size: number;
  uploadKey?: string;
  urls?: string[];
  objectId?: string;
  bucketKey?: string;
  objectKey?: string;
}


@Injectable()
export class AccDocsUploadService {
  private cache = new Map<string, CacheEntry>(); // per-upload cache

  constructor(
    private readonly accAuth: ACCAuthService
  ) {}

  async prepareUpload(accUserId: string, projectId: string, hubId: string, folderId: string, file: Express.Multer.File) {
    const user = await this.accAuth.getCurrentUserWithValidToken(accUserId);
    // const token = user.accessToken;
    const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlZiakZvUzhQU3lYODQyMV95dndvRUdRdFJEa19SUzI1NiIsInBpLmF0bSI6ImFzc2MifQ.eyJzY29wZSI6WyJkYXRhOnJlYWQiLCJkYXRhOndyaXRlIiwiZGF0YTpjcmVhdGUiLCJkYXRhOnNlYXJjaCIsImJ1Y2tldDpjcmVhdGUiLCJidWNrZXQ6cmVhZCIsImJ1Y2tldDp1cGRhdGUiLCJidWNrZXQ6ZGVsZXRlIiwidmlld2FibGVzOnJlYWQiXSwiY2xpZW50X2lkIjoidFRYODBHQjhiSVRjZkFuNkdNTUpWaDVMcmxHSFdBV2NZdHhIZ1lTOXROOHFybXd3IiwiaXNzIjoiaHR0cHM6Ly9kZXZlbG9wZXIuYXBpLmF1dG9kZXNrLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXV0b2Rlc2suY29tIiwianRpIjoicmdUcHF5elp3bndXZ2puVUFxanhmMnJUVFI4QmRYa0RNM1dYZjZUSnpzZ3B1TnNiVlpPZGZjS2kwRWtDVktpOSIsImV4cCI6MTc1MjY2NDk2MCwidXNlcmlkIjoiNE4zSlFBRVRQNDNTQUw2VSJ9.PdjinK5Br7pDL4K67fVtwVI7n7x_xhUJ5dr60e24104Alo6Z6KdG2GEZSChCyFvII0X3kQvkJFT1ZJxQ10knz1om3eZTRKLJf6g2jT2DywoQEm5GqHBmgQgHuzvipPdjM-lEdlkiwRTUnr8ywu3dFF3WFmACKC0MjuToec_6am4UQQTz3dOZtqZcdfowZto4AzNDE3YA0kCaIXJrv7sAbKZgKtlZvzKg-_If_0DPOTg4g1PkcFrzbjBdeF1wVDwhGP9vQ6GqrGFPQFtpZMLIJEjvb7EaWs6omKuwjA2PunNKSZTTOesHw3hDQfbRU8rAzwq-uir3e4eaU7QBbrT0Hw';
    const { originalname: name, size } = file;

    console.log(`File: ${name}, Size: ${size}, Mime: ${file.mimetype}`);

    this.cache.set(accUserId, { name, size });

    // Create storage object
    const resp = await axios.post(
      `https://developer.api.autodesk.com/data/v1/projects/${projectId}/storage`,
      {
        jsonapi: { version: '1.0' },
        data: {
          type: 'objects',
          attributes: { name },
          relationships: { target: { data: { type: 'folders', id: folderId } } },
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const objectId: string = resp.data.data.id;
    // const bucketKey = objectId.split('/:')[1].split('/')[0];
    // const objectKey = objectId.split('/').pop();
    if (!objectId) {
      console.error('Failed storage create, response:', resp.data);
      throw new Error('Storage creation failed');
    }
    
    // Safely parse URN
    const urnPattern = /^urn:adsk\.objects:os\.object:([^\/]+)\/(.+)$/;
    const match = objectId.match(urnPattern);
    if (!match) {
      console.error('Invalid URN', objectId);
      throw new Error('Invalid object urn format');
    }
    const [, bucketKey, objectKey] = match;
    

    const entry = this.cache.get(accUserId)!;
    Object.assign(entry, { objectId, bucketKey, objectKey });

    // Get signed S3 URLs (single or chunked)
    if (!bucketKey || !objectKey) {
      throw new Error('bucketKey or objectKey is undefined');
    }
    const bt = new BinaryTransferClient(token);
    const parts = Math.ceil(size / (5 * 1024 * 1024));
    const { uploadKey, urls } = await bt._getUploadUrls(bucketKey, objectKey, parts, 1);

    Object.assign(entry, { uploadKey, urls });

    return { uploadKey, urls };
  }

  async uploadChunks(accUserId: string, file: Express.Multer.File) {
    const entry = this.cache.get(accUserId);
    if (!entry?.urls) throw new Error('Upload not initialized');

    // const bt = new BinaryTransferClient((await this.accAuth.getCurrentUserWithValidToken(accUserId)).accessToken);
    const bt = new BinaryTransferClient('eyJhbGciOiJSUzI1NiIsImtpZCI6IlZiakZvUzhQU3lYODQyMV95dndvRUdRdFJEa19SUzI1NiIsInBpLmF0bSI6ImFzc2MifQ.eyJzY29wZSI6WyJkYXRhOnJlYWQiLCJkYXRhOndyaXRlIiwiZGF0YTpjcmVhdGUiLCJkYXRhOnNlYXJjaCIsImJ1Y2tldDpjcmVhdGUiLCJidWNrZXQ6cmVhZCIsImJ1Y2tldDp1cGRhdGUiLCJidWNrZXQ6ZGVsZXRlIiwidmlld2FibGVzOnJlYWQiXSwiY2xpZW50X2lkIjoidFRYODBHQjhiSVRjZkFuNkdNTUpWaDVMcmxHSFdBV2NZdHhIZ1lTOXROOHFybXd3IiwiaXNzIjoiaHR0cHM6Ly9kZXZlbG9wZXIuYXBpLmF1dG9kZXNrLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXV0b2Rlc2suY29tIiwianRpIjoicmdUcHF5elp3bndXZ2puVUFxanhmMnJUVFI4QmRYa0RNM1dYZjZUSnpzZ3B1TnNiVlpPZGZjS2kwRWtDVktpOSIsImV4cCI6MTc1MjY2NDk2MCwidXNlcmlkIjoiNE4zSlFBRVRQNDNTQUw2VSJ9.PdjinK5Br7pDL4K67fVtwVI7n7x_xhUJ5dr60e24104Alo6Z6KdG2GEZSChCyFvII0X3kQvkJFT1ZJxQ10knz1om3eZTRKLJf6g2jT2DywoQEm5GqHBmgQgHuzvipPdjM-lEdlkiwRTUnr8ywu3dFF3WFmACKC0MjuToec_6am4UQQTz3dOZtqZcdfowZto4AzNDE3YA0kCaIXJrv7sAbKZgKtlZvzKg-_If_0DPOTg4g1PkcFrzbjBdeF1wVDwhGP9vQ6GqrGFPQFtpZMLIJEjvb7EaWs6omKuwjA2PunNKSZTTOesHw3hDQfbRU8rAzwq-uir3e4eaU7QBbrT0Hw');
    // upload each chunk/url pair
    await Promise.all(entry.urls.map((url, idx) => axios.put(url, file.buffer.slice(idx * 5e6, (idx + 1) * 5e6), { headers: { 'Content-Type': 'application/octet-stream' }, raxConfig: { instance: axios } })));

    const complete = await bt._completeUpload(entry.bucketKey!, entry.objectKey!, entry.uploadKey!);

    Object.assign(entry, complete);
    return complete;
  }

  async finalize(accUserId: string, projectId: string, folderId: string) {
    const entry = this.cache.get(accUserId);
    if (!entry?.objectId) throw new Error('Upload not finalized');

    // const user = await this.accAuth.getCurrentUserWithValidToken(accUserId);
    const user = { accessToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlZiakZvUzhQU3lYODQyMV95dndvRUdRdFJEa19SUzI1NiIsInBpLmF0bSI6ImFzc2MifQ.eyJzY29wZSI6WyJkYXRhOnJlYWQiLCJkYXRhOndyaXRlIiwiZGF0YTpjcmVhdGUiLCJkYXRhOnNlYXJjaCIsImJ1Y2tldDpjcmVhdGUiLCJidWNrZXQ6cmVhZCIsImJ1Y2tldDp1cGRhdGUiLCJidWNrZXQ6ZGVsZXRlIiwidmlld2FibGVzOnJlYWQiXSwiY2xpZW50X2lkIjoidFRYODBHQjhiSVRjZkFuNkdNTUpWaDVMcmxHSFdBV2NZdHhIZ1lTOXROOHFybXd3IiwiaXNzIjoiaHR0cHM6Ly9kZXZlbG9wZXIuYXBpLmF1dG9kZXNrLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXV0b2Rlc2suY29tIiwianRpIjoicmdUcHF5elp3bndXZ2puVUFxanhmMnJUVFI4QmRYa0RNM1dYZjZUSnpzZ3B1TnNiVlpPZGZjS2kwRWtDVktpOSIsImV4cCI6MTc1MjY2NDk2MCwidXNlcmlkIjoiNE4zSlFBRVRQNDNTQUw2VSJ9.PdjinK5Br7pDL4K67fVtwVI7n7x_xhUJ5dr60e24104Alo6Z6KdG2GEZSChCyFvII0X3kQvkJFT1ZJxQ10knz1om3eZTRKLJf6g2jT2DywoQEm5GqHBmgQgHuzvipPdjM-lEdlkiwRTUnr8ywu3dFF3WFmACKC0MjuToec_6am4UQQTz3dOZtqZcdfowZto4AzNDE3YA0kCaIXJrv7sAbKZgKtlZvzKg-_If_0DPOTg4g1PkcFrzbjBdeF1wVDwhGP9vQ6GqrGFPQFtpZMLIJEjvb7EaWs6omKuwjA2PunNKSZTTOesHw3hDQfbRU8rAzwq-uir3e4eaU7QBbrT0Hw' };
    await axios.post(
      `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items`,
      {
        jsonapi: { version: '1.0' },
        data: {
          type: 'items',
          attributes: { displayName: entry.name, extension: { type: 'items:autodesk.bim360:File', version: '1.0' } },
          relationships: {
            tip: { data: { type: 'versions', id: '1' } },
            parent: { data: { type: 'folders', id: folderId } },
          },
        },
        included: [
          {
            type: 'versions',
            id: '1',
            attributes: { name: entry.name, extension: { type: 'versions:autodesk.bim360:File', version: '1.0' } },
            relationships: { storage: { data: { type: 'objects', id: entry.objectId } } },
          },
        ],
      },
      { headers: { Authorization: `Bearer ${user.accessToken}`, 'Content-Type': 'application/vnd.api+json' } }
    );
    return { item: true };
  }
}

// Helper for S3 transfer
class BinaryTransferClient {
  private axios;
  constructor(token: string) {
    this.axios = axios.create({ baseURL: 'https://developer.api.autodesk.com/oss/v2/', headers: { Authorization: `Bearer ${token}` } });
    rax.attach(this.axios);
  }

  _getUploadUrls(bucketKey: string, objectKey: string, parts: number, firstPart: number) {
    return this.axios.get(`buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}/signeds3upload?parts=${parts}&firstPart=${firstPart}`).then(r => r.data);
  }

  _completeUpload(bucketKey: string, objectKey: string, uploadKey: string) {
    return this.axios.post(`buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}/signeds3upload`, { uploadKey }).then(r => r.data);
  }
}
