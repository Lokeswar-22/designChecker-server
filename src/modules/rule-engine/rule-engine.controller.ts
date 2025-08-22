import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from 'src/shared/interceptor/cache.interceptor';
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
  ): Promise<ValidationResponse> {
    return this.ruleEngineService.executeRule(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Post('rule2')
  async rule2(
    @Body() body: { elementGroupId: string; accUserId: string },
  ): Promise<ValidationResponse> {
    return this.ruleEngineService.executeRule2(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Post('rule3')
  async rule3(
    @Body()
    body: {
      elementGroupId: string;
      accUserId: string;
      levelName: string;
    },
  ): Promise<ValidationResponse> {
    return this.ruleEngineService.executeRule3(
      body.elementGroupId,
      body.accUserId,
      body.levelName,
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

  @Post('rule1/failures')
  async getFailedValidations(
    @Body() body: { elementGroupId: string; accUserId: string },
  ) {
    return this.ruleEngineService.getFailedDoorValidations(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Post('rule1/summary')
  async getValidationSummary(
    @Body() body: { elementGroupId: string; accUserId: string },
  ) {
    return this.ruleEngineService.getDoorValidationSummary(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Post('rule1/failed-ids')
  async getFailedElementIds(
    @Body() body: { elementGroupId: string; accUserId: string },
  ): Promise<string[]> {
    return this.ruleEngineService.getFailedElementIds(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Post('rule1/breakdown')
  async getFailureBreakdown(
    @Body() body: { elementGroupId: string; accUserId: string },
  ): Promise<Record<string, number>> {
    return this.ruleEngineService.getFailureBreakdown(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Post('rule1/legacy')
  async rule1Legacy(
    @Body() body: { elementGroupId: string; accUserId: string },
  ) {
    return this.ruleEngineService.executeRuleLegacy(
      body.elementGroupId,
      body.accUserId,
    );
  }

  @Get('getDoorData/:elementGroupId')
  @UseInterceptors(CacheInterceptor)
  async getDoorData(
    @Query('accUserId') accUserId: string,
    @Param('elementGroupId') elementGroupId: string,
  ) {
    const res1 = await this.ruleEngineService.getDoorsType(
      elementGroupId,
      accUserId,
    );
    const res2 = await this.ruleEngineService.getDoorsInstance(
      elementGroupId,
      accUserId,
    );

    if (res1 && res2) return { res1, res2 };
  }

  @Get('getRampData/:elementGroupId')
  @UseInterceptors(CacheInterceptor)
  async getRampData(
    @Query('accUserId') accUserId: string,
    @Param('elementGroupId') elementGroupId: string,
  ) {
    const res1 = await this.ruleEngineService.getRampsType(
      elementGroupId,
      accUserId,
    );
    const res2 = await this.ruleEngineService.getRampsInstance(
      elementGroupId,
      accUserId,
    );

    if (res1 && res2) return { res1, res2 };
  }

  @Get('getParkingData/:elementGroupId/:Levels')
  @UseInterceptors(CacheInterceptor)
  async getParkingData(
    @Query('accUserId') accUserId: string,
    @Param('elementGroupId') elementGroupId: string,
    @Param('Levels') Levels: string,
  ) {
    const res = await this.ruleEngineService.getParkingInstance(
      elementGroupId,
      accUserId,
      Levels,
    );

    return res;
  }

  @Get('getRampData2/:elementGroupId')
  async getRampData2(
    @Query('accUserId') accUserId: string,
    @Param('elementGroupId') elementGroupId: string,
  ) {
    const res = await this.ruleEngineService.getRampInstance(
      elementGroupId,
      accUserId,
    );
    return res;
  }

  @Get('getStairsData/:elementGroupId')
  @UseInterceptors(CacheInterceptor)
  async getStairsData(
    @Query('accUserId') accUserId: string,
    @Param('elementGroupId') elementGroupId: string,
  ) {
    const res1 = await this.ruleEngineService.getStairsType(
      elementGroupId,
      accUserId,
    );
    const res2 = await this.ruleEngineService.getStairsInstance(
      elementGroupId,
      accUserId,
    );

    if (res1 && res2) return { res1, res2 };
  }

  @Post('projects/:projectId/createissues')
  async createIssuesBatch(
    @Param('projectId') projectId: string,
    @Param('accUserId') accUserId: string,
    @Body()
    requestBody: {
      issues: any[];
    },
  ) {
    const { issues } = requestBody;

    if (!issues || issues.length === 0) {
      return {
        error: 'No issues provided',
        total: 0,
        successful: 0,
        failed: 0,
      };
    }

    const result = await this.issueService.createIssuesBatch(
      projectId,
      accUserId,
      issues,
    );

    return {
      message: 'Batch processing completed',
      ...result,
    };
  }
}
