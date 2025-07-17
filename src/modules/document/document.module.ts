import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from 'src/shared/entities/document.entity';
import { JWTService } from 'src/shared/services/jwt.service';
import { UserService } from '../user/user.service';
import { RequestService } from 'src/shared/services/request.service';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import { ACCUser } from 'src/shared/entities/acc-user.entity';
import { User } from 'src/shared/entities/user.entity';
import { APSToken } from 'src/shared/entities/aps-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, ACCUser, User, APSToken])],
  providers: [DocumentService, ACCAuthService, JWTService, UserService, RequestService],
  controllers: [DocumentController]
})
export class DocumentModule {}