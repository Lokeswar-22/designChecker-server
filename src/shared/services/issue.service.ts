import { Injectable } from '@nestjs/common';
import { Issue } from '../entities/issue.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { ACCAuthService } from 'src/modules/acc-auth/acc-auth.service';
import { RequestService } from 'src/shared/services/request.service';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    private readonly accAuthService: ACCAuthService,
    private readonly requestService: RequestService
  ) {}

  async createIssue(projectId: string, accUserId: string): Promise<any> {

    const body = this.requestService.getBody();
    const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
    const API_URL  = `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issues`;
    const payload = {
        title: body.title,
        description: body?.description,
        issueSubtypeId: body?.issueSubtypeId,
        status: body?.status,
        assignedTo: body?.assignedTo,
        assignedToType: body?.assignedToType,
        dueDate: body?.dueDate,
        startDate: body?.startDate,
        rootCauseId: body?.rootCauseId,
        published: body?.published,
        linkedDocuments: body?.linkedDocuments,
        // locationId: body?.locationId,
        // locationDetails: body?.locationDetails,
        // issueTemplateId: body?.issueTemplateId,
        // permittedActions: body?.permittedActions,
        // watchers: body?.watchers,
        // customAttributes: body?.customAttributes,
        // gpsCoordinates: body?.gpsCoordinates,
        // snapshotHasMarkups: body?.snapshotHasMarkups,
    };

    const response = await axios.post(API_URL, payload, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if(response.status === 201) {
        const issue = new Issue();
        issue.issueId = response.data.issueId;
        issue.issueTypeId = response.data.issueTypeId;
        issue.issueSubtypeId = response.data.issueSubtypeId;
        issue.title = body.title;
        issue.description = body.description;
        issue.status = body.status;
        issue.createdAt = new Date();
        await this.issueRepository.save(issue);
    }
    return true;

  }
}