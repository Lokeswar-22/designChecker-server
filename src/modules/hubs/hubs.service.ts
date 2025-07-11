import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataManagementClient } from '@aps_sdk/data-management';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class HubsService {
  private dataManagementClient = new DataManagementClient();

  constructor(private readonly authService: AuthService) {}

  async getHubs(apsUserId: string) {
    const user = await this.authService.refreshUserTokens(apsUserId);
    console.log("user : " , user);
    if (!user || !user.accessToken) {
      throw new UnauthorizedException('Login required');
    }
    const resp = await this.dataManagementClient.getHubs({ accessToken: user.accessToken });
    console.log("resp : ");
    console.dir(resp, { depth: null });
    return resp.data;
  }

  async getProjects(hubId: string, apsUserId: string) {
    const user = await this.authService.refreshUserTokens(apsUserId);
    if (!user || !user.accessToken) {
      throw new UnauthorizedException('Login required');
    }
    const resp = await this.dataManagementClient.getHubProjects(hubId, { accessToken: user.accessToken });
    return resp.data;
  }

  async getProjectContents(hubId: string, projectId: string, folderId: string | undefined, apsUserId: string) {
    const user = await this.authService.refreshUserTokens(apsUserId);
    if (!user || !user.accessToken) {
      throw new UnauthorizedException('Login required');
    }
    if (!folderId) {
      const resp = await this.dataManagementClient.getProjectTopFolders(hubId, projectId, { accessToken: user.accessToken });
      return resp.data;
    } else {
      const resp = await this.dataManagementClient.getFolderContents(projectId, folderId, { accessToken: user.accessToken });
      return resp.data;
    }
  }

  async getItemVersions(projectId: string, itemId: string, apsUserId: string) {
    const user = await this.authService.refreshUserTokens(apsUserId);
    if (!user || !user.accessToken) {
      throw new UnauthorizedException('Login required');
    }
    const resp = await this.dataManagementClient.getItemVersions(projectId, itemId, { accessToken: user.accessToken });
    return resp.data;
  }
} 