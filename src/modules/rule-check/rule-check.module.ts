import { Module } from '@nestjs/common';
import { RuleCheckController } from './rule-check.controller';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { HubsModule } from '../hubs/hubs.module';
import { IssueService } from 'src/shared/services/issue.service';
import { ACCAuthModule } from '../acc-auth/acc-auth.module';
import { DbConnectionModule } from 'src/shared/config/db-connection.module';

@Module({
  imports: [RuleEngineModule, HubsModule, ACCAuthModule, DbConnectionModule],
  controllers: [RuleCheckController],
  providers: [IssueService],
})
export class RuleCheckModule {}
