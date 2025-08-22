import { Module } from '@nestjs/common';
import { IssueService } from 'src/shared/services/issue.service';
import { RequestService } from 'src/shared/services/request.service';
import { SharedModule } from 'src/shared/shared.module';
import { RuleEngineController } from './rule-engine.controller';
import { RuleEngineService } from './rule-engine.service';

@Module({
  imports: [SharedModule],
  controllers: [RuleEngineController],
  providers: [RuleEngineService, IssueService, RequestService],
})
export class RuleEngineModule {}
