import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { HubsService } from './hubs.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';

@Controller('hubs')
@UseGuards(AuthGuard)
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Get()
  async getHubs(@Query('apsUserId') apsUserId: string) {
    return this.hubsService.getHubs(apsUserId);
  }

  @Get(':hubId/projects')
  async getProjects(
    @Param('hubId') hubId: string,
    @Query('apsUserId') apsUserId: string,
  ) {
    return this.hubsService.getProjects(hubId, apsUserId);
  }

  @Get(':hubId/projects/:projectId/contents')
  async getProjectContents(
    @Param('hubId') hubId: string,
    @Param('projectId') projectId: string,
    @Query('folderId') folderId: string,
    @Query('apsUserId') apsUserId: string,
  ) {
    return this.hubsService.getProjectContents(hubId, projectId, folderId, apsUserId);
  }

  @Get('projects/:projectId/items/:itemId/versions')
  async getItemVersions(
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
    @Query('apsUserId') apsUserId: string,
  ) {
    return this.hubsService.getItemVersions(projectId, itemId, apsUserId);
  }
}