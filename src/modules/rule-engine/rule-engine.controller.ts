import { Body, Controller, Post } from '@nestjs/common';
import { IssueService } from 'src/shared/services/issue.service';
import { RuleEngineService } from './rule-engine.service';
import { ValidationResponse } from './rule-interface/rule.interface';
@Controller('rule-engine')
export class RuleEngineController {
  constructor(
    private readonly ruleEngineService: RuleEngineService,
    private readonly issueService: IssueService,
  ) {}

  @Post('rule1')
  async rule1(
    @Body() body: { elementGroupId: string; accUserId: string },
  ) /*: Promise<ValidationResponse> */ {
    return this.ruleEngineService.executeRule(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Post('rule2')
  async rule2(
    @Body()
    body: {
      elementGroupId: string;
      accUserId: string;
      levelName: string;
    },
  ): Promise<ValidationResponse> {
    return this.ruleEngineService.executeRule2(
      body.elementGroupId,
      body.accUserId,
      body.levelName,
    );
  }

  @Post('rule3')
  async rule3(
    @Body() body: { elementGroupId: string; accUserId: string },
  ): Promise<ValidationResponse> {
    return this.ruleEngineService.executeRule3(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Post('rule4')
  async rule4(
    @Body() body: { elementGroupId: string; accUserId: string },
  ): Promise<any> {
    return this.ruleEngineService.executeRule4(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Post('rule5')
  async rule5(
    @Body() body: { elementGroupId: string; accUserId: string },
  ): Promise<ValidationResponse> {
    return this.ruleEngineService.executeRule5(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Post('rule6')
  async rule6(
    @Body() body: { elementGroupId: string; accUserId: string },
  ): Promise<ValidationResponse> {
    return this.ruleEngineService.executeRule6(
      body.elementGroupId,
      body.accUserId,
    );
  }
}
