import { Module } from '@nestjs/common';
import { HubsService } from './hubs.service';
import { HubsController } from './hubs.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCUser } from 'src/shared/entities/acc-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ACCUser])],
  controllers: [HubsController],
  providers: [HubsService, AuthService],
})
export class HubsModule {}