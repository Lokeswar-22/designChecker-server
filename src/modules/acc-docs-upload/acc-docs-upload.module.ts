import { Module } from '@nestjs/common';
import { AccDocsUploadService } from './acc-docs-upload.service';
import { AccDocsUploadController } from './acc-docs-upload.controller';
import { ACCAuthService } from 'src/modules/acc-auth/acc-auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCUser } from 'src/shared/entities/acc-user.entity';
import { User } from 'src/shared/entities/user.entity';
import { JWTService } from 'src/shared/services/jwt.service';
import { UserService } from '../user/user.service';
import { RequestService } from 'src/shared/services/request.service';
import { Document } from 'src/shared/entities/document.entity';
import { DocumentService } from '../document/document.service';

@Module({
  imports: [TypeOrmModule.forFeature([ACCUser, User, Document])],
  controllers: [AccDocsUploadController],
  providers: [AccDocsUploadService, ACCAuthService, JWTService, UserService, RequestService, DocumentService],
})
export class AccDocsUploadModule {}