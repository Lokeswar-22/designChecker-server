import { Module } from '@nestjs/common';
import { RuleEngineService } from './rule-engine.service';
import { DoorClearOpeningRule } from './rules/door-clear-opening.rule';
import { RampLandingProxyRule } from './rules/ramp-landing.rule';
import { RampGradientRule } from './rules/ramp-gradient.rule';
import { StairHandrailRule } from './rules/stairs-handrail.rule';
import { WashroomDimensionProxyRule } from './rules/washroom-dimension-proxy.rule';

@Module({
  providers: [RuleEngineService, DoorClearOpeningRule, RampLandingProxyRule, RampGradientRule, StairHandrailRule,WashroomDimensionProxyRule],
  exports: [RuleEngineService],
})
export class RuleEngineModule {}
