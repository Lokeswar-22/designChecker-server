import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe,
  Query 
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentService.create(createDocumentDto);
  }

  @Get()
  findAll() {
    return this.documentService.findAll();
  }

  @Get('acc-docs')
  findAccDocs() {
    return this.documentService.findAccDocs();
  }

  @Get('non-acc-docs')
  findNonAccDocs() {
    return this.documentService.findNonAccDocs();
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId') projectId: string) {
    return this.documentService.findByProjectId(projectId);
  }

  @Get('project/:projectId/count')
  countByProjectId(@Param('projectId') projectId: string) {
    return this.documentService.countByProjectId(projectId);
  }

  @Get('project/:projectId/acc-docs/count')
  countAccDocsByProjectId(@Param('projectId') projectId: string) {
    return this.documentService.countAccDocsByProjectId(projectId);
  }

  @Get('hub/:hubId')
  findByHubId(@Param('hubId') hubId: string) {
    return this.documentService.findByHubId(hubId);
  }

  @Get('folder/:folderId')
  findByFolderId(@Param('folderId') folderId: string) {
    return this.documentService.findByFolderId(folderId);
  }

  @Get('storage/:storageUrn')
  findByStorageUrn(@Param('storageUrn') storageUrn: string) {
    return this.documentService.findByStorageUrn(storageUrn);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateDocumentDto: UpdateDocumentDto
  ) {
    return this.documentService.update(id, updateDocumentDto);
  }

  @Patch(':id/acc-docs')
  updateInAccDocs(
    @Param('id', ParseIntPipe) id: number,
    @Body('inAccDocs') inAccDocs: boolean
  ) {
    return this.documentService.updateInAccDocs(id, inAccDocs);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.remove(id);
  }
}
