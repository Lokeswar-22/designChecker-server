import { Controller, Get, Query, Param, UseGuards, Body, Post, BadRequestException } from '@nestjs/common';
import { HubsService } from './hubs.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { IssueService } from 'src/shared/services/issue.service';
@Controller('hubs')
// @UseGuards(AuthGuard)
export class HubsController {
  constructor(
    private readonly hubsService: HubsService,
    private readonly issueService: IssueService) {}

  @Post('getAvailableCategories')
  async getAvailableCategories(
    @Query('accUserId') accUserId: string,
    @Body() body: {elementGroupId: string}
  ) {
    return this.hubsService.getAvailableCategories(accUserId);
  }

  @Get()
  async getHubs(@Query('accUserId') accUserId: string) {
    return this.hubsService.getHubs(accUserId);
  }

  @Get(':hubId/projects')
  async getProjects(
    @Param('hubId') hubId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return this.hubsService.getProjects(hubId, accUserId);
  }

  @Get('projects/:projectId/element-groups')
  async getElementGroups(
    @Param('projectId') projectId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return this.hubsService.getElementGroups(projectId, accUserId);
  }

  @Post('elementsCategory')
  async getElementsFromCategory(
    @Query('accUserId') accUserId: string,
    @Body('elementGroupId') elementGroupId: string,
    @Body('propertyFilter') propertyFilter: string,
  ) {
    return this.hubsService.getDoorsWithWidth(elementGroupId, accUserId, propertyFilter);
  }

  @Get(':hubId/projects/:projectId/top-folders')
  async getTopFolders(
    @Param('hubId') hubId: string,
    @Param('projectId') projectId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return this.hubsService.getTopFolders(hubId, projectId, accUserId);
  }

  @Get('upload')
  async getHubsUpload(@Query('accUserId') accUserId: string) {
    return this.hubsService.getHubsUpload(accUserId);
  }

  @Get('project-id')
async getProjectId(
  @Query('accUserId') accUserId: string,
  @Query('projectName') projectName: string
) {
  if (!accUserId || !projectName) {
    throw new BadRequestException('apsUserId and projectName are required');
  }

  return {
    projectId: await this.hubsService.getProjectIdByName(accUserId, projectName),
  };
}


  @Get('projects/:projectId/folders/:folderId/contents')
  async getFolderContents(
    @Param('projectId') projectId: string,
    @Param('folderId') folderId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return this.hubsService.getFolderContents(projectId, folderId, accUserId);
  }

  @Get(':hubId/projects/upload')
  async getProjectsUpload(
    @Param('hubId') hubId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return this.hubsService.getProjectsUpload(hubId, accUserId);
  }

  @Get('projects/:projectId/issues')
  async getIssues(
    @Param('projectId') projectId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return this.hubsService.getIssues(projectId, accUserId);
  }

  @Post('projects/:projectId/issues')
  async createIssue(
    @Param('projectId') projectId: string,
    @Query('accUserId') accUserId: string,
    @Body() body: any
  ) {
    return this.issueService.createIssue(projectId, accUserId);
  }
}

