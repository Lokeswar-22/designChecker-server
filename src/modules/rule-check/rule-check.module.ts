import { Module } from '@nestjs/common';
import { RuleCheckController } from './rule-check.controller';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { HubsModule } from '../hubs/hubs.module';

@Module({
  imports: [RuleEngineModule, HubsModule],
  controllers: [RuleCheckController],
})
export class RuleCheckModule {}
