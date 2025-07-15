import { Controller, Get, Query, Param, UseGuards, Body, Post } from '@nestjs/common';
import { HubsService } from './hubs.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';

@Controller('hubs')
@UseGuards(AuthGuard)
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

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

  @Get('elementsCategory')
  async getElementsFromCategory(
    @Query('accUserId') accUserId: string,
    @Body('elementGroupId') elementGroupId: string,
    @Body('propertyFilter') propertyFilter: string,
  ) {
    return this.hubsService.getElementsFromCategory(elementGroupId, accUserId, propertyFilter);
  }
}