import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    const user = await this.accAuthService.getCurrentUserWithValidToken(apsUserId);
    console.log('User:', user);
    if (!user || !user.accessToken) throw new UnauthorizedException('Login required');
    const resp = await this.dataManagementClient.getHubs({ accessToken: user.accessToken });
    return resp.data;
  }

  async getProjectsUpload(hubId: string, apsUserId: string) {
    const user = await this.accAuthService.getCurrentUserWithValidToken(apsUserId);
    if (!user || !user.accessToken) throw new UnauthorizedException('Login required');
    const resp = await this.dataManagementClient.getHubProjects(hubId, { accessToken: user.accessToken });
    return resp.data;
  }


  async getTopFolders(hubId: string, projectId: string, accUserId: string) {
    try {
      const user = await this.accAuthService.getCurrentUserWithValidToken(accUserId);
      if (!user || !user.accessToken) throw new UnauthorizedException('Login required');

      const url = `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`;
      
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      
      console.log('Top folders response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get top folders:', error);
      throw error;
    }
  }

  private async queryGraphQL(query: string, variables: any = {}, accUserId: string) {
    try {
      console.log('=== GraphQL Query Debug ===');
      console.log('Query:', query);
      console.log('Variables:', JSON.stringify(variables, null, 2));
      console.log('ACC User ID:', accUserId);
      
      const user = await this.accAuthService.getCurrentUserWithValidToken(accUserId);
      console.log('User found:', !!user);
      console.log('Access token exists:', !!user?.accessToken);
      
      if (!user || !user.accessToken) throw new UnauthorizedException('Login required');

      const requestBody = { query, variables };
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      console.log('Endpoint:', this.endpoint);
      console.log('Headers:', {
        Authorization: `Bearer ${user.accessToken.substring(0, 20)}...`,
        'Content-Type': 'application/json',
      });

      const response = await firstValueFrom(
        this.http.post(
          this.endpoint,
          requestBody,
          { headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json',
            } },
        ),
      );
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Full response data:', JSON.stringify(response.data, null, 2));
      
      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
      }
      
      const result = response.data.data;
      console.log('Extracted data:', JSON.stringify(result, null, 2));
      console.log('=== End GraphQL Query Debug ===');
      
      return result;
    } catch (error) {
      console.error('GraphQL query failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  }

  async getAvailableCategories(accUserId: string) {
    console.log('=== getAvailableCategories Debug ===');
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
    console.log('Request body from service:', body);
    const { elementGroupId } = body;
    console.log('Extracted elementGroupId:', elementGroupId);
    
    const result = await this.queryGraphQL(q, { elementGroupId }, accUserId);
    console.log('getAvailableCategories result:', JSON.stringify(result, null, 2));
    console.log('=== End getAvailableCategories Debug ===');
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
    console.log('=== getElementsFromCategory Debug ===');
    console.log('elementGroupId:', elementGroupId);
    console.log('accUserId:', accUserId);
    console.log('propertyFilter:', propertyFilter);
    
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
    
    console.log('GraphQL variables:', JSON.stringify(variables, null, 2));
    
    const result = await this.queryGraphQL(q, variables, accUserId);
    console.log('getElementsFromCategory result:', JSON.stringify(result, null, 2));
    console.log('=== End getElementsFromCategory Debug ===');
    return result;
  }

  async fetchPropertiesForRules(elementGroupId: string, accUserId: string, propertyFilter?: string): Promise<any>{
    console.log('=== fetchPropertiesForRules Debug ===');
    console.log('elementGroupId:', elementGroupId);
    console.log('accUserId:', accUserId);
    console.log('propertyFilter:', propertyFilter);
    
    const graphqlResponse = await this.getElementsFromCategory(elementGroupId, accUserId, propertyFilter);
    console.log('GraphQL response:', JSON.stringify(graphqlResponse, null, 2));

    if (!graphqlResponse?.elementsByElementGroup?.results) {
      console.log('No results found in GraphQL response');
      return [];
    }

    const mappedResults = graphqlResponse.elementsByElementGroup.results.map(e => {
      return {
        elementId: e.id,
        category: 'Doors',  // Hardcode or fetch if available in real data
        properties: e.properties.results.map(p => ({
          name: p.name,
          value: this.convertValueToMM(p)
        }))
      };
    });
    
    console.log('Mapped results:', JSON.stringify(mappedResults, null, 2));
    console.log('=== End fetchPropertiesForRules Debug ===');
    return mappedResults;
  }
  
  // Helper to convert meters to mm
  private convertValueToMM(prop: any): number | any {
    if (!prop.value || typeof prop.value !== 'number') return prop.value;
    return prop.definition.units?.name === 'Meters' ? prop.value * 1000 : prop.value;
  }
  
}