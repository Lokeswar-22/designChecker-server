import { Controller, Get, Param, Query } from '@nestjs/common';
import { RuleDataService } from './rule-data.service';
import { RuleDataHelperService } from './rule-data.helperService';

@Controller('rule-data')
export class RuleDataController {

    constructor(
        private readonly ruleDataService: RuleDataService,
        private readonly ruleDataHelperService: RuleDataHelperService
    ) {}

    @Get('checkRuleData/:elementGroupId')
    async checkRuleData(
        @Param('elementGroupId') elementGroupId: string,
        @Query('accUserId') accUserId: string
    ) {
        return await this.ruleDataService.checkRuleData(accUserId, elementGroupId);
    }

    @Get('getRuleData1/:elementGroupId')
    async getRuleData1(
        @Param('elementGroupId') elementGroupId: string,
        @Query('accUserId') accUserId: string
    ) {
        return await this.ruleDataHelperService.rule1(elementGroupId, accUserId);
    }

}
