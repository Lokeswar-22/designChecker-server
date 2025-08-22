import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ACCAuthService } from "../acc-auth/acc-auth.service";
import { HubsService } from "../hubs/hubs.service";
import { DmDiscovery } from "src/shared/entities/dm-discovery.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class DmDiscoveryService {

    constructor(
        private readonly accAuthService: ACCAuthService,
        private readonly hubsService: HubsService,
        @InjectRepository(DmDiscovery) private readonly dmDiscoveryRepository: Repository<DmDiscovery>
    ) {}

    async checkStatus(accUserId: string) {
        try {

            const validateAccUser = await this.accAuthService.checkAuthStatus(accUserId);
            if(validateAccUser.accUserId) {
                const isDataExists = await this.dmDiscoveryRepository.findOne({ where: { accUserId } });
                if(isDataExists) {
                    return {message: 'Data already exists, Do you want to update the data?'};
                }
                else {
                        return {message: 'No Data Found for this user'};
                    }
                }

        } catch (error) {
            return {
                message: 'crawling failed',
                error: error.message
            };
        }
    }

    async initiateCrawlData(accUserId: string) {
        try {
            this.getCrawlData(accUserId);
            return {message: 'crawling initiated successfully'};
        } catch (error) {
            return {
                message: 'crawling failed',
                error: error.message
            };
        }
    }

    async getCrawlData(accUserId: string) {
        try {
            const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
            if (!accessToken) throw new UnauthorizedException('Login required');

            // Fetch all hubs
            const getHubs = await this.hubsService.getHubs(accUserId);

            // For each hub, retrieve all projects and save with hubId
            const projects: Array<{HubId: string; ProjectId: string; ProjectName: string}> = [];
            for (const hub of getHubs.hubs.results) {
                try {
                    const getProjects = await this.hubsService.getProjects(hub.id, accUserId);
                    const hubProjects = getProjects.projects.results.map(project => ({
                        HubId: hub.id,
                        ProjectId: project.id,
                        ProjectName: project.name
                    }));
                    projects.push(...hubProjects);
                } catch (error) {
                    console.error(`Error fetching projects for hub ${hub.id}:`, error.message);
                }
            }

            // For each project, fetch elementGroups and save with hubId and projectId
            const elementGroups: Array<{
                HubId: string;
                ProjectId: string;
                ProjectName: string;
                ElementGroupId: string;
                ElementGroupName: string;
                FileUrn: string;
                FileVersionUrn: string
            }> = [];
            for (const project of projects) {
                try {
                    const getElementGroups = await this.hubsService.getElementGroups(project.ProjectId, accUserId);
                    const projectElementGroups = getElementGroups.elementGroupsByProject.results.map(elementGroup => ({
                        HubId: project.HubId,
                        HubName: getHubs.hubs.results.find(hub => hub.id === project.HubId)?.name,
                        ProjectId: project.ProjectId,
                        ProjectName: project.ProjectName,
                        ElementGroupId: elementGroup.id,
                        ElementGroupName: elementGroup.name,
                        FileUrn: elementGroup.alternativeIdentifiers?.fileUrn,
                        FileVersionUrn: elementGroup.alternativeIdentifiers?.fileVersionUrn
                    }));
                    elementGroups.push(...projectElementGroups);
                } catch (error) {
                    console.error(`Error fetching element groups for project ${project.ProjectId}:`, error.message);
                }
            }

           this.saveData(accUserId, elementGroups);
        } catch (error) {
            console.error('Error in getCrawlData:', error);
            throw error;
        }
    }

    async saveData(accUserId: string, elementGroups: any) {

        for (const elementGroup of elementGroups) {
            const dmDiscovery = new DmDiscovery();
            dmDiscovery.accUserId = accUserId;
            dmDiscovery.hubId = elementGroup.HubId;
            dmDiscovery.hubName = elementGroup.HubName;
            dmDiscovery.projectId = elementGroup.ProjectId;
            dmDiscovery.projectName = elementGroup.ProjectName;
            dmDiscovery.elementGroupId = elementGroup.ElementGroupId;
            dmDiscovery.elementGroupName = elementGroup.ElementGroupName;
            dmDiscovery.fileUrn = elementGroup.FileUrn;
            dmDiscovery.fileVersionUrn = elementGroup.FileVersionUrn;
            dmDiscovery.createdAt = new Date();
            await this.dmDiscoveryRepository.save(dmDiscovery);
        }
    }

}