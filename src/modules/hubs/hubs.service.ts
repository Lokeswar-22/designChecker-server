import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataManagementClient } from '@aps_sdk/data-management';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RequestService } from 'src/shared/services/request.service';
import axios from 'axios';

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
    return resp.data;
  }

  async getProjectsUpload(hubId: string, apsUserId: string) {
    const accessToken = await this.accAuthService.getValidAccessToken(apsUserId);
    if (!accessToken) throw new UnauthorizedException('Login required');
    const resp = await this.dataManagementClient.getHubProjects(hubId, { accessToken: accessToken });
    return resp.data;
  }

  async getProjectIdByName(apsUserId: string, projectName: string): Promise<string> {
    const accessToken = await this.accAuthService.getValidAccessToken(apsUserId);
    if (!accessToken) throw new UnauthorizedException('Login required');

    const hubs = await this.dataManagementClient.getHubs({ accessToken });
    if (!hubs?.data?.length) throw new NotFoundException('No hubs found for user');

    for (const hub of hubs.data) {
      if (!hub.id) continue;

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
      if (response.data.errors) throw new Error('GraphQL errors: ' + JSON.stringify(response.data.errors));
      const result = response.data.data;
      return result;
    } catch (error) {
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
                  alternativeIdentifiers { fileUrn fileVersionUrn }

          }
          pagination { cursor }
        }
      }`;
    return this.queryGraphQL(q, { projectId }, accUserId);
  }

  async getElementsFromCategory(
    elementGroupId: string,
    accUserId: string,
    propertyFilter?: string
  ) {
    const ELEMENTS_PAGE = `
      query ($elementGroupId: ID!, $filter: ElementFilterInput, $cursor: String, $limit: Int = 500) {
        elementsByElementGroup(
          elementGroupId: $elementGroupId,
          filter: $filter,
          pagination: { cursor: $cursor, limit: $limit }
        ) {
          pagination { cursor }
          results { id name }
        }
      }`;

    const ELEMENT_PROPERTIES_PAGE = `
      query ($elementId: ID!, $cursor: String, $limit: Int = 500) {
        elementAtTip(elementId: $elementId) {
          id
          name
          properties(pagination: { cursor: $cursor, limit: $limit }) {
            pagination { cursor }
            results {
              name
              value
              definition { units { name } }
            }
          }
        }
      }`;

    const allElementIds: string[] = [];
    const allElementsBasic: Record<string, { id: string; name: string }> = {};
    let cursor: string | null = null;

    do {
      const variables: any = { elementGroupId, cursor, limit: 500 };
      if (propertyFilter) variables.filter = { query: propertyFilter };

      const page = await this.queryGraphQL(ELEMENTS_PAGE, variables, accUserId);
      const block = page?.elementsByElementGroup;
      const results = block?.results ?? [];

      for (const e of results) {
        allElementIds.push(e.id);
        allElementsBasic[e.id] = { id: e.id, name: e.name };
      }
      cursor = block?.pagination?.cursor ?? null;
    } while (cursor);

    const BATCH_SIZE = 10;

    const resultsFull: Array<{
      id: string;
      name: string;
      properties: Array<{
        name: string;
        value: any;
        definition?: { units?: { name?: string } | null } | null;
      }>;
    }> = [];

    for (let i = 0; i < allElementIds.length; i += BATCH_SIZE) {
      const slice = allElementIds.slice(i, i + BATCH_SIZE);

      const batch = slice.map(async (elementId) => {
        let pcursor: string | null = null;
        const props: any[] = [];

        do {
          const v = { elementId, cursor: pcursor, limit: 500 };
          const resp = await this.queryGraphQL(ELEMENT_PROPERTIES_PAGE, v, accUserId);
          const node = resp?.elementAtTip;
          const pblock = node?.properties;

          if (pblock?.results?.length) props.push(...pblock.results);
          pcursor = pblock?.pagination?.cursor ?? null;
        } while (pcursor);

        return {
          id: elementId,
          name: allElementsBasic[elementId]?.name ?? "",
          properties: props,
        };
      });

      const batchOut = await Promise.all(batch);
      resultsFull.push(...batchOut);
    }

    return resultsFull;
  }


  async fetchPropertiesForRules(elementGroupId: string, accUserId: string, propertyFilter?: string): Promise<any>{

    const graphqlResponse = await this.getElementsFromCategory(elementGroupId, accUserId, propertyFilter);
    if (!graphqlResponse?.length) {
      return [];

    }

    const mappedResults = graphqlResponse.map(e => {
      return {
        elementId: e.id,
        category: 'Doors',
        properties: e.properties.map(p => ({
          name: p.name,
          value: this.convertValueToMM(p)
        }))
      };
    });

    return mappedResults;
  }
  async fetchRampsWithProperties(elementGroupId: string, accUserId: string, propertyFilter?: string): Promise<any>{

    const graphqlResponse = await this.getElementsFromCategory(elementGroupId, accUserId, propertyFilter);
    if (!graphqlResponse?.length) {
      return [];
    }

    const mappedResults = graphqlResponse.map(e => {
      return {
        elementId: e.id,
        category: 'Ramps',
        properties: e.properties.map(p => ({
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

  async getIssues(projectId: string, accUserId:string) {

    const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
    const API_URL = `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issues`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await axios.get(API_URL, { headers });
    return response.data;
  }

}