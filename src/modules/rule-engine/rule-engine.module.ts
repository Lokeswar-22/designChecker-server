import { Module } from '@nestjs/common';
import { RuleEngineService } from './rule-engine.service';
import { DoorClearOpeningRule } from './rules/door-clear-opening.rule';

@Module({
  providers: [RuleEngineService, DoorClearOpeningRule],
  exports: [RuleEngineService],
})
export class RuleEngineModule {}
