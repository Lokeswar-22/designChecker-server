import { Module } from '@nestjs/common';
import { RuleEngineService } from './rule-engine.service';
import { RuleEngineController } from './rule-engine.controller';
import { ACCAuthModule } from '../acc-auth/acc-auth.module';
import { HttpModule } from '@nestjs/axios';
import { IssueService } from 'src/shared/services/issue.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from 'src/shared/entities/issue.entity';
import { RequestService } from 'src/shared/services/request.service';

@Module({
  imports: [ACCAuthModule,HttpModule,TypeOrmModule.forFeature([Issue])],
  controllers: [RuleEngineController],
  providers: [RuleEngineService, IssueService,RequestService]
})
export class RuleEngineModule {}
