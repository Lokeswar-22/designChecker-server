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

@Module({
  imports: [TypeOrmModule.forFeature([ACCUser, User])],
  controllers: [HubsController],
  providers: [HubsService, ACCAuthService, JWTService, UserService, RequestService],
})
export class HubsModule {}