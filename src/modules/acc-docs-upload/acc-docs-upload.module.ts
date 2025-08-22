import { Module } from '@nestjs/common';
import { AccDocsUploadService } from './acc-docs-upload.service';
import { AccDocsUploadController } from './acc-docs-upload.controller';
import { JWTService } from 'src/shared/services/jwt.service';
import { UserService } from '../user/user.service';
import { RequestService } from 'src/shared/services/request.service';
import { MulterModule } from '@nestjs/platform-express';
import { ACCAuthModule } from '../acc-auth/acc-auth.module';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MulterModule.register({ limits: { fileSize: 500 * 1024 * 1024 } }),
    CacheModule.register(),
    ACCAuthModule,
    HttpModule
  ],
  controllers: [AccDocsUploadController],
  providers: [AccDocsUploadService, JWTService, UserService, RequestService, ACCAuthService],
})
export class AccDocsUploadModule {}