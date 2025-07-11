import { Module } from '@nestjs/common';
import { AccDocsUploadService } from './acc-docs-upload.service';
import { AccDocsUploadController } from './acc-docs-upload.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCUser } from 'src/shared/entities/acc-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ACCUser])],
  controllers: [AccDocsUploadController],
  providers: [AccDocsUploadService, AuthService],
})
export class AccDocsUploadModule {}