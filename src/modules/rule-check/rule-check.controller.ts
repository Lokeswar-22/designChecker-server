import { Controller, Post, Body } from '@nestjs/common';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { HubsService } from '../hubs/hubs.service';
import { CheckRuleDto } from './dto/check-rule.dto';
import { IssueService } from 'src/shared/services/issue.service';

@Controller('rule-check')
export class RuleCheckController {
  constructor(
    private readonly ruleEngine: RuleEngineService,
    private readonly aecData: HubsService,
    private readonly issueService: IssueService
  ) {}

  private toDateOnlyISOString(date: Date): string {
    return date.toISOString().split('T')[0];
  }



  @Post('rule1')
  async checkDoorClearOpening(@Body() checkRuleDto: CheckRuleDto) {
    const doors = await this.aecData.fetchPropertiesForRules(
      checkRuleDto.elementGroupId,
      checkRuleDto.accUserId,
      checkRuleDto.category,
    );
    const result = this.ruleEngine.executeRule('door_clear_opening', doors);
    return { rule: 'door_clear_opening', result };
    // const today = new Date();
    // const midnightUTC = new Date(Date.UTC(
    //   today.getUTCFullYear(),
    //   today.getUTCMonth(),
    //   today.getUTCDate()
    // ));
    // const dueDateUTC = new Date(Date.UTC(
    //   today.getUTCFullYear(),
    //   today.getUTCMonth(),
    //   today.getUTCDate() + 5
    // ));

    // const startDate = this.toDateOnlyISOString(midnightUTC);
    // const dueDate = this.toDateOnlyISOString(dueDateUTC);

    // const failed = result.results.filter(r => !r.passed);
    // const issues = failed.map(f => ({
    //   title: `Door clearance issue - Revit Element ID: ${f.revitElementId || f.elementId}`,
    //   description: `IfcGUID: ${f.ifcGUID || 'N/A'} | ${f.message}`,
    //   issueSubtypeId: '0d960e5e-92af-4876-b514-aacbbadaca1e',
    //   status: 'open',
    //   assignedTo: checkRuleDto.accUserId.toString(),
    //   assignedToType: 'user',
    //   dueDate: dueDate,
    //   startDate: startDate,
    //   // rootCauseId: 'hardcode',
    //   published: true,
    //   projectId: checkRuleDto.projectId,
    //   linkedDocuments: checkRuleDto.linkedDocuments,
    // }));

    // for (const issue of issues) {
    //   console.log(issue)
    //   this.issueService.createIssue(issue, checkRuleDto.accUserId);
    // }

    // return { rule: 'door_clear_opening', ...result, issuesCreated: issues.length };

  }

  @Post('rule2')
  async checkLevelLandingProxy(@Body() checkRuleDto: CheckRuleDto) {
    const ramps = await this.aecData.fetchRampsWithProperties(
      checkRuleDto.elementGroupId,
      checkRuleDto.accUserId,
      checkRuleDto.category,
    );
    {

    const validation = this.ruleEngine.executeRule('ramp_landing_proxy', ramps);
    return {
      rule: 'ramp_landing_proxy',
      ...validation
    };
  }

}


@Post('rule3')
async checkRampGradient(@Body() checkRuleDto: CheckRuleDto) {
  const ramps = await this.aecData.fetchRampsWithProperties(
    checkRuleDto.elementGroupId,
    checkRuleDto.accUserId,
    checkRuleDto.category,
  );
  const validation = this.ruleEngine.executeRule('ramp_gradient', ramps);
  return {
    rule: 'ramp_gradient',
    ...validation
  };
}

@Post('rule4')
async checkStairHandrail(@Body() checkRuleDto: CheckRuleDto) {
  const stairs = await this.aecData.fetchPropertiesForRules(
    checkRuleDto.elementGroupId,
    checkRuleDto.accUserId,
    checkRuleDto.category,
  );
  const validation = this.ruleEngine.executeRule('stair_handrail', stairs);
  return {
    rule: 'stair_handrail',
    ...validation
  };
}

@Post('rule5')
async checkWashroomDimensionProxy(@Body() checkRuleDto: CheckRuleDto) {
  const walls = await this.aecData.fetchPropertiesForRules(
    checkRuleDto.elementGroupId,
    checkRuleDto.accUserId,
    checkRuleDto.category,
  );
  const validation = this.ruleEngine.executeRule('washroom_dimensions_proxy', walls);
  return {
    rule: 'washroom_dimensions_proxy',
    ...validation
  };
}






}