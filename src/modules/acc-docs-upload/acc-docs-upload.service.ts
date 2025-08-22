import { Injectable, StreamableFile } from '@nestjs/common';
import axios from 'axios';
import * as rax from 'retry-axios';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../../shared/entities/index';

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
  private cache = new Map<string, CacheEntry>();

  constructor(
    private readonly accAuth: ACCAuthService,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async prepareUpload(accUserId: string, projectId: string, hubId: string, folderId: string, file: Express.Multer.File) {
    const accessToken = await this.accAuth.getValidAccessToken(accUserId);
    const token = accessToken;
    const { originalname: name, size, mimetype } = file;
    const extension = name.split('.').pop() || " ";
    const createdAt = new Date()|| " ";

    const document = new Document();
    document.name = name;
    document.extension = extension;
    document.size = size;
    document.mimetype = mimetype;
    document.hubId = hubId;
    document.projectId = projectId;
    document.folderId = folderId;
    document.createdAt = createdAt;

    await this.documentRepository.save(document);

    this.cache.set(accUserId, { name, size });

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
    if (!objectId) {
      throw new Error('Storage creation failed');
    }

    const urnPattern = /^urn:adsk\.objects:os\.object:([^\/]+)\/(.+)$/;
    const match = objectId.match(urnPattern);
    if (!match) {
      throw new Error('Invalid object urn format');
    }
    const [, bucketKey, objectKey] = match;
    const entry = this.cache.get(accUserId)!;
    Object.assign(entry, { objectId, bucketKey, objectKey });

    if (!bucketKey || !objectKey) {
      throw new Error('bucketKey or objectKey is undefined');
    }

    const bt = new BinaryTransferClient(token);
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const parts = Math.ceil(size / CHUNK_SIZE);
    const { uploadKey, urls } = await bt._getUploadUrls(bucketKey, objectKey, parts, 1);
    Object.assign(entry, { uploadKey, urls, chunkSize: CHUNK_SIZE });

    return { uploadKey, urls };
  }

  async uploadChunks(accUserId: string, file: Express.Multer.File) {
    const entry = this.cache.get(accUserId);
    if (!entry?.urls) throw new Error('Upload not initialized');
    const accessToken = await this.accAuth.getValidAccessToken(accUserId);
    const bt = new BinaryTransferClient(accessToken);
    try {
      const uploadPromises = entry.urls.map(async (url, idx) => {
        const chunkSize = entry.chunkSize || 5 * 1024 * 1024;
        const start = idx * chunkSize;
        const end = Math.min((idx + 1) * chunkSize, file.buffer.length);
        const chunk = file.buffer.slice(start, end);
        if (entry.urls && idx < entry.urls.length - 1 && chunk.length < 5 * 1024 * 1024) {
        }
        const response = await axios.put(url, chunk, {
          headers: { 'Content-Type': 'application/octet-stream' },
          raxConfig: { instance: axios },
          timeout: 30000
        });
        return response;
      });
      await Promise.all(uploadPromises);
    } catch (error) {
      throw error;
    }
    const complete = await bt._completeUpload(entry.bucketKey!, entry.objectKey!, entry.uploadKey!);
    Object.assign(entry, complete);
    return complete;
  }

  async finalize(accUserId: string, projectId: string, folderId: string) {
    const entry = this.cache.get(accUserId);
    if (!entry?.objectId) throw new Error('Upload not finalized');

    const accessToken = await this.accAuth.getValidAccessToken(accUserId);
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
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/vnd.api+json' } }
    );
    return { item: true };
  }
}

class BinaryTransferClient {
  private axios;
  constructor(token: string) {
    this.axios = axios.create({ baseURL: 'https://developer.api.autodesk.com/oss/v2/', headers: { Authorization: `Bearer ${token}` } });
    rax.attach(this.axios);
  }

  _getUploadUrls(bucketKey: string, objectKey: string, parts: number, firstPart: number) {
    const url = `buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}/signeds3upload?parts=${parts}&firstPart=${firstPart}`;

    return this.axios.get(url)
      .then(r => {
        return r.data;
      })
      .catch(error => {
        throw error;
      });
  }

  _completeUpload(bucketKey: string, objectKey: string, uploadKey: string) {

    return this.axios.post(`buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}/signeds3upload`, { uploadKey })
      .then(r => {
        return r.data;
      })
      .catch(error => {
        throw error;
      });
  }
}
