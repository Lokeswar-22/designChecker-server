import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataManagementClient } from '@aps_sdk/data-management';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HubsService {

  private endpoint = 'https://developer.api.autodesk.com/aec/graphql';

  constructor(
    private readonly accAuthService: ACCAuthService,
    private readonly http: HttpService
  ) {}

  // async getHubs(apsUserId: string) {
  //   const user = await this.accAuthService.refreshUserTokens(apsUserId);
  //   if (!user || !user.accessToken) throw new UnauthorizedException('Login required');
  //   const resp = await this.dataManagementClient.getHubs({ accessToken: user.accessToken });
  //   return resp.data;
  // }

  // async getProjects(hubId: string, apsUserId: string) {
  //   const user = await this.accAuthService.refreshUserTokens(apsUserId);
  //   if (!user || !user.accessToken) throw new UnauthorizedException('Login required');
  //   const resp = await this.dataManagementClient.getHubProjects(hubId, { accessToken: user.accessToken });
  //   return resp.data;
  // }

  // async getProjectContents(hubId: string, projectId: string, folderId: string | undefined, apsUserId: string) {
  //   const user = await this.accAuthService.refreshUserTokens(apsUserId);
  //   if (!user || !user.accessToken) throw new UnauthorizedException('Login required');
  //   if (!folderId) {
  //     const resp = await this.dataManagementClient.getProjectTopFolders(hubId, projectId, { accessToken: user.accessToken });
  //     return resp.data;
  //   } else {
  //     const resp = await this.dataManagementClient.getFolderContents(projectId, folderId, { accessToken: user.accessToken });
  //     return resp.data;
  //   }
  // }

  // async getItemVersions(projectId: string, itemId: string, apsUserId: string) {
  //   const user = await this.accAuthService.refreshUserTokens(apsUserId);
  //   if (!user || !user.accessToken) throw new UnauthorizedException('Login required');
  //   const resp = await this.dataManagementClient.getItemVersions(projectId, itemId, { accessToken: user.accessToken });
  //   return resp.data;
  // }

  private async queryGraphQL(query: string, variables: any = {}, accUserId: string) {
    try {
      const user = await this.accAuthService.refreshUserTokens(accUserId);
      if (!user || !user.accessToken) throw new UnauthorizedException('Login required');

      const response = await firstValueFrom(
        this.http.post(
          this.endpoint,
          { query, variables },
          { headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json',
            } },
        ),
      );
      return response.data.data;
    } catch (error) {
      console.error('GraphQL query failed:', error);
      throw error;
    }
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
}