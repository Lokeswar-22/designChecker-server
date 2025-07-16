import { Controller, Post, Body } from '@nestjs/common';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { HubsService } from '../hubs/hubs.service';
import { CheckRuleDto } from './dto/check-rule.dto';

@Controller('rule-check')
export class RuleCheckController {
  constructor(
    private readonly ruleEngine: RuleEngineService,
    private readonly aecData: HubsService,
  ) {}

  @Post('rule1')
  async checkDoorClearOpening(@Body() checkRuleDto: CheckRuleDto) {
    const doors = await this.aecData.fetchPropertiesForRules(
      checkRuleDto.projectId,
      checkRuleDto.accUserId,
      checkRuleDto.category
    );
    const result = this.ruleEngine.executeRule('door_clear_opening', doors);
    return { rule: 'door_clear_opening', result };
  }
}
