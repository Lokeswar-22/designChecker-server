import { Injectable } from '@nestjs/common';
import { IRule, RuleResult, RuleValidationResult } from './rules/rule.interface';
import { DoorClearOpeningRule } from './rules/door-clear-opening.rule';

@Injectable()
export class RuleEngineService {
  private readonly rules: IRule[];

  constructor(private doorRule: DoorClearOpeningRule) {
    this.rules = [this.doorRule];
  }

  executeRule(ruleId: string, elements: any[]): RuleValidationResult {
    const rule = this.rules.find(r => r.ruleId === ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }
    return rule.validate(elements);
  }
}
 