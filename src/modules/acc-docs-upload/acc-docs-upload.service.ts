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
  chunkSize?: number;
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
    const token = 'TOKEN';
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
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB in bytes (5,242,880 bytes)
    const parts = Math.ceil(size / CHUNK_SIZE);
    console.log('=== PREPARE UPLOAD DEBUG ===');
    console.log('Bucket key:', bucketKey);
    console.log('Object key:', objectKey);
    console.log('File size:', size);
    console.log('Chunk size:', CHUNK_SIZE);
    console.log('Calculated parts:', parts);
    
    const { uploadKey, urls } = await bt._getUploadUrls(bucketKey, objectKey, parts, 1);
    
    console.log('Upload key:', uploadKey);
    console.log('Number of URLs:', urls?.length);
    console.log('URLs:', urls);

    Object.assign(entry, { uploadKey, urls, chunkSize: CHUNK_SIZE });

    return { uploadKey, urls };
  }

  async uploadChunks(accUserId: string, file: Express.Multer.File) {
    const entry = this.cache.get(accUserId);
    if (!entry?.urls) throw new Error('Upload not initialized');

    console.log('=== UPLOAD CHUNKS DEBUG ===');
    console.log('Entry:', JSON.stringify(entry, null, 2));
    console.log('File size:', file.size);
    console.log('File buffer length:', file.buffer.length);
    console.log('Number of URLs:', entry.urls.length);

    // const bt = new BinaryTransferClient((await this.accAuth.getCurrentUserWithValidToken(accUserId)).accessToken);
    const bt = new BinaryTransferClient('TOKEN');
    
    // upload each chunk/url pair
    try {
      const uploadPromises = entry.urls.map(async (url, idx) => {
        const chunkSize = entry.chunkSize || 5 * 1024 * 1024; // Default to 5MB if not set
        const start = idx * chunkSize;
        const end = Math.min((idx + 1) * chunkSize, file.buffer.length);
        const chunk = file.buffer.slice(start, end);
        
        console.log(`Chunk ${idx + 1}:`);
        console.log(`  URL: ${url}`);
        console.log(`  Start: ${start}, End: ${end}, Size: ${chunk.length}`);
        console.log(`  Content-Type: application/octet-stream`);
        
        // Validate chunk size for S3 multipart upload
        if (entry.urls && idx < entry.urls.length - 1 && chunk.length < 5 * 1024 * 1024) {
          console.warn(`Warning: Chunk ${idx + 1} size (${chunk.length}) is below S3 minimum (${5 * 1024 * 1024})`);
        }
        
        const response = await axios.put(url, chunk, { 
          headers: { 'Content-Type': 'application/octet-stream' }, 
          raxConfig: { instance: axios },
          timeout: 30000 // 30 second timeout
        });
        
        console.log(`  Chunk ${idx + 1} uploaded successfully:`, response.status);
        return response;
      });

      await Promise.all(uploadPromises);
      console.log('All chunks uploaded successfully');
    } catch (error) {
      console.error('=== UPLOAD ERROR DETAILS ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error status:', error.response?.status);
      console.error('Error status text:', error.response?.statusText);
      console.error('Error data:', error.response?.data);
      console.error('Error headers:', error.response?.headers);
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request headers:', error.config?.headers);
      console.error('Request data length:', error.config?.data?.length);
      throw error;
    }

    const complete = await bt._completeUpload(entry.bucketKey!, entry.objectKey!, entry.uploadKey!);

    Object.assign(entry, complete);
    return complete;
  }

  async finalize(accUserId: string, projectId: string, folderId: string) {
    const entry = this.cache.get(accUserId);
    if (!entry?.objectId) throw new Error('Upload not finalized');

    // const user = await this.accAuth.getCurrentUserWithValidToken(accUserId);
    const user = { accessToken: 'TOKEN' };
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
    console.log('=== GET UPLOAD URLS DEBUG ===');
    console.log('Requesting URLs for:', { bucketKey, objectKey, parts, firstPart });
    const url = `buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}/signeds3upload?parts=${parts}&firstPart=${firstPart}`;
    console.log('Request URL:', url);
    
    return this.axios.get(url)
      .then(r => {
        console.log('Upload URLs response:', JSON.stringify(r.data, null, 2));
        return r.data;
      })
      .catch(error => {
        console.error('Error getting upload URLs:', error.response?.data || error.message);
        throw error;
      });
  }

  _completeUpload(bucketKey: string, objectKey: string, uploadKey: string) {
    console.log('=== COMPLETE UPLOAD DEBUG ===');
    console.log('Completing upload for:', { bucketKey, objectKey, uploadKey });
    
    return this.axios.post(`buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}/signeds3upload`, { uploadKey })
      .then(r => {
        console.log('Complete upload response:', JSON.stringify(r.data, null, 2));
        return r.data;
      })
      .catch(error => {
        console.error('Error completing upload:', error.response?.data || error.message);
        throw error;
      });
  }
}
