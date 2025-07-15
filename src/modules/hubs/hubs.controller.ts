import { Controller, Get, Query, Param, UseGuards, Body } from '@nestjs/common';
import { HubsService } from './hubs.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';

@Controller('hubs')
@UseGuards(AuthGuard)
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

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

  @Get(':hubId/projects/:projectId/element-groups')
  async getElementGroups(
    @Param('hubId') hubId: string,
    @Param('projectId') projectId: string,
    @Query('accUserId') accUserId: string,
  ) {
    return this.hubsService.getElementGroups(projectId, accUserId);
  }

  @Get(':hubId/projects/:projectId/elements')
  async getElementsFromCategory(
    @Param('hubId') hubId: string,
    @Param('projectId') projectId: string,
    @Query('accUserId') accUserId: string,
    @Body('elementGroupId') elementGroupId: string,
    @Body('propertyFilter') propertyFilter: string,
  ) {
    return this.hubsService.getElementsFromCategory(projectId, elementGroupId, accUserId, propertyFilter);
  }
}