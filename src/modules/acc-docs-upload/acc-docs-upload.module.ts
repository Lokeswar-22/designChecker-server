import { Module } from '@nestjs/common';
import { AccDocsUploadService } from './acc-docs-upload.service';
import { AccDocsUploadController } from './acc-docs-upload.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCUser } from 'src/shared/entities/acc-user.entity';
import { Document } from 'src/shared/entities/document.entity';
import { DocumentService } from 'src/modules/document/document.service';

@Module({
  imports: [TypeOrmModule.forFeature([ACCUser, Document])],
  controllers: [AccDocsUploadController],
  providers: [AccDocsUploadService, AuthService, DocumentService],
})
export class AccDocsUploadModule {}