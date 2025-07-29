import { Injectable } from '@nestjs/common';
import { IRule, RuleResult, RuleValidationResult } from './rules/rule.interface';
import { DoorClearOpeningRule } from './rules/door-clear-opening.rule';
import { RampLandingProxyRule } from './rules/ramp-landing.rule';
import { RampGradientRule } from './rules/ramp-gradient.rule';
import { StairHandrailRule } from './rules/stairs-handrail.rule';
import { WashroomDimensionProxyRule } from './rules/washroom-dimension-proxy.rule';

@Injectable()
export class RuleEngineService {
  private readonly rules: IRule[];

  constructor(
    private doorRule: DoorClearOpeningRule, 
    private rampLandingRule: RampLandingProxyRule,
    private rampGradientRule: RampGradientRule,
    private stairHandrailRule: StairHandrailRule,
    private washroomDimensionProxyRule: WashroomDimensionProxyRule
     
  ) {
    this.rules = [
      this.doorRule, 
      this.rampLandingRule, 
      this.rampGradientRule,
      this.stairHandrailRule,
      this.washroomDimensionProxyRule
    
    ];
  }

  executeRule(ruleId: string, elements: any[]): RuleValidationResult {
    const rule = this.rules.find(r => r.ruleId === ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }
    return rule.validate(elements);
  }
}
 