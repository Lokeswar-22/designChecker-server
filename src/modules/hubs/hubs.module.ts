import { Module } from '@nestjs/common';
import { HubsService } from './hubs.service';
import { HubsController } from './hubs.controller';
import { ACCAuthService } from 'src/modules/acc-auth/acc-auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCUser } from 'src/shared/entities/acc-user.entity';
import { JWTService } from 'src/shared/services/jwt.service';
import { UserService } from '../user/user.service';
import { User } from 'src/shared/entities/user.entity';
import { RequestService } from 'src/shared/services/request.service';
import { HttpModule } from '@nestjs/axios';
import { DataManagementClient } from '@aps_sdk/data-management';
import { RuleCheckModule } from '../rule-check/rule-check.module';
import { APSToken } from 'src/shared/entities/aps-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ACCUser, User, APSToken]),
    HttpModule
  ],
  controllers: [HubsController],
  providers: [
    HubsService,
    ACCAuthService,
    JWTService,
    UserService,
    RequestService,
    DataManagementClient,
  ],
  exports: [HubsService],
})
export class HubsModule {}