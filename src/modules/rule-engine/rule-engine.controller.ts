import { Body, Controller, Post } from '@nestjs/common';
import { RuleEngineService, DoorValidationResponse } from './rule-engine.service';

@Controller('rule-engine')
export class RuleEngineController {
  constructor(private readonly ruleEngineService: RuleEngineService) {}

  @Post('rule1')
  async rule1(@Body() body: { elementGroupId: string; accUserId: string }): Promise<DoorValidationResponse> {
    return this.ruleEngineService.executeRule(body.elementGroupId, body.accUserId);
  }

  // Additional endpoints for utility methods
  @Post('rule1/failures')
  async getFailedValidations(@Body() body: { elementGroupId: string; accUserId: string }) {
    return this.ruleEngineService.getFailedDoorValidations(body.elementGroupId, body.accUserId);
  }

  @Post('rule1/summary')
  async getValidationSummary(@Body() body: { elementGroupId: string; accUserId: string }) {
    return this.ruleEngineService.getDoorValidationSummary(body.elementGroupId, body.accUserId);
  }

  @Post('rule1/failed-ids')
  async getFailedElementIds(@Body() body: { elementGroupId: string; accUserId: string }): Promise<string[]> {
    return this.ruleEngineService.getFailedElementIds(body.elementGroupId, body.accUserId);
  }

  @Post('rule1/breakdown')
  async getFailureBreakdown(@Body() body: { elementGroupId: string; accUserId: string }): Promise<Record<string, number>> {
    return this.ruleEngineService.getFailureBreakdown(body.elementGroupId, body.accUserId);
  }

  // Backward compatibility endpoint
  @Post('rule1/legacy')
  async rule1Legacy(@Body() body: { elementGroupId: string; accUserId: string }) {
    return this.ruleEngineService.executeRuleLegacy(body.elementGroupId, body.accUserId);
  }
}
