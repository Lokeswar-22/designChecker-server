import { Controller, Get, Param, Query } from '@nestjs/common';
import { RuleDataHelperService } from './rule-data.helperService';
import { RuleDataService } from './rule-data.service';

@Controller('rule-data')
export class RuleDataController {
  constructor(
    private readonly ruleDataService: RuleDataService,
    private readonly ruleDataHelperService: RuleDataHelperService,
  ) {}

  @Get('checkRuleData/:elementGroupId')
  async checkRuleData(
    @Param('elementGroupId') elementGroupId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return await this.ruleDataService.checkRuleData(accUserId, elementGroupId);
  }

  @Get('getRuleData1/:elementGroupId')
  async getRuleData1(
    @Param('elementGroupId') elementGroupId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return await this.ruleDataHelperService.rule1(elementGroupId, accUserId);
  }

  @Get('getRuleData2/:elementGroupId')
  async getRuleData2(
    @Param('elementGroupId') elementGroupId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return await this.ruleDataHelperService.rule2(elementGroupId, accUserId);
  }

  @Get('getRuleData3/:elementGroupId')
  async getRuleData3(
    @Param('elementGroupId') elementGroupId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return await this.ruleDataHelperService.rule3(elementGroupId, accUserId);
  }

  @Get('getRuleData4/:elementGroupId')
  async getRuleData4(
    @Param('elementGroupId') elementGroupId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return await this.ruleDataHelperService.rule4(elementGroupId, accUserId);
  }

  @Get('getRuleData5/:elementGroupId')
  async getRuleData5(
    @Param('elementGroupId') elementGroupId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return await this.ruleDataHelperService.rule5(elementGroupId, accUserId);
  }
}
