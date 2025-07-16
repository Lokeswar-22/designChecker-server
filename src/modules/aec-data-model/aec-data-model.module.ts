import { Module } from '@nestjs/common';
import { AecDataModelController } from './aec-data-model.controller';
import { AecDataModelService } from './aec-data-model.service';
import { User } from 'src/shared/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCUser } from 'src/shared/entities/acc-user.entity';
import { HttpModule } from '@nestjs/axios';
import { JWTService } from 'src/shared/services/jwt.service';
import { UserService } from '../user/user.service';
import { ACCAuthService } from 'src/modules/acc-auth/acc-auth.service';
import { RequestService } from 'src/shared/services/request.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ACCUser, User]),
    HttpModule
  ],
  providers: [AecDataModelService, ACCAuthService, JWTService, UserService, RequestService],
  controllers: [AecDataModelController]
})
export class AecDataModelModule {}
