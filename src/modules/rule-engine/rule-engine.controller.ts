import { Body, Controller, Get, Param, Post, Query, UseInterceptors } from '@nestjs/common';
import { RuleEngineService, DoorValidationResponse } from './rule-engine.service';
import { IssueService } from 'src/shared/services/issue.service';
import { CacheInterceptor } from 'src/shared/interceptor/cache.interceptor';

@Controller('rule-engine')
export class RuleEngineController {
  constructor(
    private readonly ruleEngineService: RuleEngineService,
    private readonly issueService: IssueService
  ) {}

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

  @Get('getDoorData/:elementGroupId')
  @UseInterceptors(CacheInterceptor)
  async getDoorData(
    @Query('accUserId') accUserId: string,
    @Param('elementGroupId') elementGroupId: string ) {
   const res1 = await this.ruleEngineService.getDoorsType(elementGroupId, accUserId);
   const res2 = await this.ruleEngineService.getDoorsInstance(elementGroupId, accUserId);

    if(res1 && res2) return `Data Cached Successfully`;
  }

  @Post('projects/:projectId/createissues')
  async createIssuesBatch(
    @Param('projectId') projectId: string,
    @Param('accUserId') accUserId: string,
    @Body() requestBody: {
    issues: any[]
  }) {
    const {issues } = requestBody;

    if (!issues || issues.length === 0) {
      return {
        error: 'No issues provided',
        total: 0,
        successful: 0,
        failed: 0
      };
    }

    const result = await this.issueService.createIssuesBatch(
      projectId,
      accUserId,
      issues
    );

    return {
      message: 'Batch processing completed',
      ...result
    };
  }

}
