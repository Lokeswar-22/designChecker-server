import { Controller, Param, Get, UseGuards, Query, Body, Post } from '@nestjs/common';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { AecDataModelService } from './aec-data-model.service';

@Controller('aecDataModel')
@UseGuards(AuthGuard)
export class AecDataModelController {

    constructor(private readonly aecDataModelService: AecDataModelService) {}

    @Post('getElementGroupsBasedOnMetadata')
    async getElementGroupsBasedOnMetadata(
        @Body() body: {hubId: string, filter: string, pagination: string},
        @Query('accUserId') accUserId: string
    )
    {
        return this.aecDataModelService.getElementGroupsBasedOnMetadata(accUserId);
    }

    @Post('getVersionsOfAnElementGroup')
    async  getVersionsOfAnElementGroup(
        @Body() body: {elementGroupId: string},
        @Query('accUserId') accUserId: string
    )
    {
        return this.aecDataModelService.getVersionsOfAnElementGroup(accUserId);
    }

    @Post('getElementInstancesOfAParticularType')
    async getElementInstancesOfAParticularType(
        @Body() body: {elementGroupId: string, propertyFilter: string},
        @Query('accUserId') accUserId: string
    )
    {
        return this.aecDataModelService.getInstancesOfAParticularType(accUserId);
    }

    @Post('getElementInstancesInACategoryByVersion')
    async getElementInstancesInACategoryByVersion(
        @Body() body: {elementGroupId: string, versionNumber: string, propertyFilter: string},
        @Query('accUserId') accUserId: string
    )
    {
        return this.aecDataModelService.getElementInstancesInACategoryByVersion(accUserId);
    }

    @Post('getProjectElementsWithSpecificProperties')
    async getProjectElementsWithSpecificProperties(
        @Body() body: {elementGroupId: string, propertyFilter: string},
        @Query('accUserId') accUserId: string
    )
    {
        return this.aecDataModelService.getProjectElementsWithSpecificProperties(accUserId);
    }

    @Post('listAllElementsHavingConcreteMaterialInAElementGroup')
    async listAllElementsHavingConcreteMaterialInAElementGroup(
        @Body() body: {elementGroupId: string, propertyFilter: string},
        @Query('accUserId') accUserId: string
    )
    {
        return this.aecDataModelService.listAllElementsHavingConcreteMaterialInAElementGroup(accUserId);
    }

    @Post('listElementInstancesHavingConcreteMaterial')
    async listElementInstancesHavingConcreteMaterial(
        @Body() body: {elementGroupId: string, propertyFilter: string},
        @Query('accUserId') accUserId: string
    )
    {
        return this.aecDataModelService.listElementInstancesHavingConcreteMaterial(accUserId);
    }

    @Post('listElementsHavingConcreteMaterialByUsingReferenceType')
    async listElementsHavingConcreteMaterialByUsingReferenceType(
        @Body() body: {elementGroupId: string, propertyFilter: string},
        @Query('accUserId') accUserId: string
    )
    {
        return this.aecDataModelService.listElementsHavingConcreteMaterialByUsingReferenceType(accUserId);
    }

    @Post('retrieveDistinctValuesById')
    async retrieveDistinctValuesById(
        @Body() body: {elementGroupId: string, propertyDefinitionId: string, propertyFilter: string},
        @Query('accUserId') accUserId: string
    )
    {
        return this.aecDataModelService.retrieveDistinctValuesById(accUserId);
    }

    @Post('retrieveDistinctValuesByName')
    async retrieveDistinctValuesByName(
        @Body() body: {elementGroupId: string, name: string, filter: string, pagination: string},
        @Query('accUserId') accUserId: string
    )
    {
        return this.aecDataModelService.retrieveDistinctValuesByName(accUserId);
    }

}
