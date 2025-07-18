import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataManagementClient } from '@aps_sdk/data-management';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RequestService } from 'src/shared/services/request.service';

@Injectable()
export class HubsService {

  private endpoint = 'https://developer.api.autodesk.com/aec/graphql';
  private dataManagementClient = new DataManagementClient();

  constructor(
    private readonly accAuthService: ACCAuthService,
    private readonly http: HttpService,
    private readonly requestService: RequestService
  ) {}

  async getHubsUpload(apsUserId: string) {
    const accessToken = await this.accAuthService.getValidAccessToken(apsUserId);
    if (!accessToken) throw new UnauthorizedException('Login required');
    const resp = await this.dataManagementClient.getHubs({ accessToken: accessToken });
    console.log(resp.data)
    return resp.data;
  }

  async getProjectsUpload(hubId: string, apsUserId: string) {
    const accessToken = await this.accAuthService.getValidAccessToken(apsUserId);
    if (!accessToken) throw new UnauthorizedException('Login required');
    const resp = await this.dataManagementClient.getHubProjects(hubId, { accessToken: accessToken });
    console.log(resp.data)
    return resp.data;
  }

  async getProjectIdByName(apsUserId: string, projectName: string): Promise<string> {
    const accessToken = await this.accAuthService.getValidAccessToken(apsUserId);
    if (!accessToken) throw new UnauthorizedException('Login required');
  
    const hubs = await this.dataManagementClient.getHubs({ accessToken });
    if (!hubs?.data?.length) throw new NotFoundException('No hubs found for user');
  
    for (const hub of hubs.data) {
      if (!hub.id) continue;  // Skip hubs with no id
    
      const projects = await this.dataManagementClient.getHubProjects(hub.id, { accessToken });
      if (!projects?.data?.length) continue;
    
      const foundProject = projects.data.find(
        (project) => project?.attributes?.name === projectName
      );
    
      if (foundProject) {
        return foundProject.id;
      }
    }
      
    throw new NotFoundException(`Project with name "${projectName}" not found in any hub`);
  }
  


  async getTopFolders(hubId: string, projectId: string, accUserId: string) {
    try {
      const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
      if (!accessToken) throw new UnauthorizedException('Login required');

      const url = `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`;

      const response = await firstValueFrom(
        this.http.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get top folders:', error);
      throw error;
    }
  }

  async getFolderContents(projectId: string, folderId: string, accUserId: string) {
    const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
    const resp = await this.dataManagementClient.getFolderContents(projectId, folderId, { accessToken: accessToken });
    return resp.data;
  }

  private async queryGraphQL(query: string, variables: any = {}, accUserId: string) {
    try {
      const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
      const requestBody = { query, variables };
      const response = await firstValueFrom(
        this.http.post(
          this.endpoint,
          requestBody,
          { headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            } },
        ),
      );
      if (response.data.errors) console.error('GraphQL errors:', response.data.errors);
      const result = response.data.data;
      return result;
    } catch (error) {
      console.error('GraphQL query failed:', error);
      throw error;
    }
  }

  async getAvailableCategories(accUserId: string) {

    const q = `
    query ($elementGroupId: ID!) {
      distinctPropertyValuesInElementGroupByName(
        elementGroupId: $elementGroupId
        name: "Revit Category Type Id"
      ) {
        results {
          values {
            value
            count
          }
        }
      }
    }`;

    const body = await this.requestService.getBody();
    const { elementGroupId } = body;

    const result = await this.queryGraphQL(q, { elementGroupId }, accUserId);
    return result;
  }

  async getHubs(accUserId: string) {
    const q = `query { hubs { results { id name } pagination { cursor } }} `;
    return this.queryGraphQL(q, {}, accUserId);
  }

  async getProjects(hubId: string, accUserId: string) {
    const q = `
      query ($hubId:ID!) {
        projects(hubId:$hubId) {
          results { id name }
          pagination { cursor }
        }
      }`;
    return this.queryGraphQL(q, { hubId }, accUserId);
  }

  async getElementGroups(projectId: string, accUserId: string) {
    const q = `
      query ($projectId:ID!) {
        elementGroupsByProject(projectId:$projectId) {
          results {
            id
            name
          }
          pagination { cursor }
        }
      }`;
    return this.queryGraphQL(q, { projectId }, accUserId);
  }

  async getElementsFromCategory(elementGroupId: string, accUserId: string, propertyFilter?: string) {

    const q = `
      query ($elementGroupId: ID!, $filter: ElementFilterInput) {
        elementsByElementGroup(
          elementGroupId: $elementGroupId,
          filter: $filter
        ) {
          pagination {
            cursor
          }
          results {
            id
            name
            properties {
              results {
                name
                value
                definition {
                  units {
                    name
                  }
                }
              }
            }
          }
        }
      }`;

    const variables: any = { elementGroupId };
    if (propertyFilter) variables.filter = { query: propertyFilter };
    const result = await this.queryGraphQL(q, variables, accUserId);
    return result;
  }

  async fetchPropertiesForRules(elementGroupId: string, accUserId: string, propertyFilter?: string): Promise<any>{

    const graphqlResponse = await this.getElementsFromCategory(elementGroupId, accUserId, propertyFilter);
    if (!graphqlResponse?.elementsByElementGroup?.results) {
      return [];
    }

    const mappedResults = graphqlResponse.elementsByElementGroup.results.map(e => {
      return {
        elementId: e.id,
        category: 'Doors',
        properties: e.properties.results.map(p => ({
          name: p.name,
          value: this.convertValueToMM(p)
        }))
      };
    });

    return mappedResults;
  }

  private convertValueToMM(prop: any): number | any {
    if (!prop.value || typeof prop.value !== 'number') return prop.value;
    return prop.definition.units?.name === 'Meters' ? prop.value * 1000 : prop.value;
  }

}