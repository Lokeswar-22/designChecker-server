import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../../shared/entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ACCAuthService } from '../acc-auth/acc-auth.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create(createDocumentDto);
    return await this.documentRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return await this.documentRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async findByProjectId(projectId: string): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' }
    });
  }

  async findByHubId(hubId: string): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { hubId },
      order: { createdAt: 'DESC' }
    });
  }

  async findByFolderId(folderId: string): Promise<Document[]> {
    return await this.documentRepository
      .createQueryBuilder('document')
      .where('document.folderIds LIKE :folderId', { folderId: `%"${folderId}"%` })
      .orderBy('document.createdAt', 'DESC')
      .getMany();
  }

  async findAccDocs(): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { inAccDocs: true },
      order: { createdAt: 'DESC' }
    });
  }

  async findNonAccDocs(): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { inAccDocs: false },
      order: { createdAt: 'DESC' }
    });
  }

  async update(id: number, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findOne(id);
    Object.assign(document, updateDocumentDto);
    return await this.documentRepository.save(document);
  }

  async updateInAccDocs(id: number, inAccDocs: boolean): Promise<Document> {
    const document = await this.findOne(id);
    document.inAccDocs = inAccDocs;
    return await this.documentRepository.save(document);
  }

  async remove(id: number): Promise<void> {
    const document = await this.findOne(id);
    await this.documentRepository.remove(document);
  }

  async findByStorageUrn(storageUrn: string): Promise<Document | null> {
    return await this.documentRepository.findOne({ where: { storageUrn } });
  }

  async countByProjectId(projectId: string): Promise<number> {
    return await this.documentRepository.count({ where: { projectId } });
  }

  async countAccDocsByProjectId(projectId: string): Promise<number> {
    return await this.documentRepository.count({
      where: { projectId, inAccDocs: true }
    });
  }
}