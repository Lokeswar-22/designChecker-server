import { Injectable, Logger } from '@nestjs/common';
import { Issue } from '../entities/issue.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { ACCAuthService } from 'src/modules/acc-auth/acc-auth.service';
import { RequestService } from 'src/shared/services/request.service';

@Injectable()
export class IssueService {
  private readonly logger = new Logger(IssueService.name);

  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    private readonly accAuthService: ACCAuthService,
    private readonly requestService: RequestService
  ) {}

  async createIssue(projectId: string, accUserId: string): Promise<any> {

    const body = this.requestService.getBody();
    const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
    const issueSubtypeId = await this.getIssueSubtypeId(projectId, accessToken);
    const API_URL  = `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issues`;
    const payload = {
        title: body.title,
        description: body?.description,
        issueSubtypeId: issueSubtypeId.toString(),
        status: body?.status,
        assignedTo: body?.assignedTo,
        assignedToType: body?.assignedToType,
        dueDate: body?.dueDate,
        startDate: body?.startDate,
        rootCauseId: body?.rootCauseId,
        published: body?.published,
        linkedDocuments: body?.linkedDocuments,
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
        issue.issueSubtypeId = response.data.issueSubtypeId.toString();
        issue.title = body.title;
        issue.description = body.description;
        issue.status = body.status;
        issue.createdAt = new Date();
        await this.issueRepository.save(issue);
    }
    return true;

  }

  async createIssuesBatch(projectId: string, accUserId: string, issuesPayload: any[]): Promise<any> {
    const batchSize = 10;
    const delayBetweenBatches = 1500;
    const maxRetries = 3;

    const results = {
      total: issuesPayload.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ title: string; error: string }>
    };

    this.logger.log(`Starting batch processing for ${issuesPayload.length} issues`);

    const batches = this.chunkArray(issuesPayload, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      this.logger.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} issues)`);

      for (const issuePayload of batch) {
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            await this.createSingleIssue(projectId, accUserId, issuePayload);
            results.successful++;
            success = true;
            this.logger.debug(`Issue created successfully: ${issuePayload.title}`);
          } catch (error) {
            retryCount++;

            if (this.isRateLimitError(error)) {
              const waitTime = this.calculateBackoffDelay(retryCount);
              this.logger.warn(`Rate limit hit, waiting ${waitTime}ms before retry ${retryCount}/${maxRetries}`);
              await this.delay(waitTime);
            } else if (retryCount >= maxRetries) {
              results.failed++;
              results.errors.push({
                title: issuePayload.title,
                error: error.message
              });
              this.logger.error(`Failed to create issue after ${maxRetries} attempts: ${issuePayload.title}`);
            }
          }
        }
      }

      if (i < batches.length - 1) {
        this.logger.debug(`Waiting ${delayBetweenBatches}ms before next batch`);
        await this.delay(delayBetweenBatches);
      }
    }

    this.logger.log(`Batch processing completed. Success: ${results.successful}, Failed: ${results.failed}`);
    return results;
  }

  private async createSingleIssue(projectId: string, accUserId: string, issuePayload: any): Promise<void> {
    try {
      const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
      const issueSubtypeId = await this.getIssueSubtypeId(projectId, accessToken);
      const API_URL = `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issues`;

      const payload = {
        title: issuePayload.title,
        description: issuePayload?.description,
        issueSubtypeId: issuePayload?.issueSubtypeId || issueSubtypeId.toString(),
        status: issuePayload?.status || 'open',
        assignedTo: issuePayload?.assignedTo,
        assignedToType: issuePayload?.assignedToType || 'user',
        dueDate: issuePayload?.dueDate,
        startDate: issuePayload?.startDate,
        rootCauseId: issuePayload?.rootCauseId,
        published: issuePayload?.published !== undefined ? issuePayload.published : true,
        linkedDocuments: issuePayload?.linkedDocuments,
      };

      this.logger.debug('Creating issue with payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(API_URL, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.debug(`Issue created successfully: ${response.status} - ${issuePayload.title}`);

      if (response.status === 201) {
        const issue = new Issue();
        issue.issueId = response.data.issueId;
        issue.issueTypeId = response.data.issueTypeId;
        issue.issueSubtypeId = response.data.issueSubtypeId.toString();
        issue.title = issuePayload.title;
        issue.description = issuePayload.description;
        issue.status = issuePayload.status;
        issue.createdAt = new Date();
        await this.issueRepository.save(issue);
      }
    } catch (error) {
      this.logger.error(`Error creating issue "${issuePayload.title}":`, {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        projectId,
        accUserId
      });
      throw error;
    }
  }

  private chunkArray(array: any[], size: number): any[][] {
    const chunks: any[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRateLimitError(error: any): boolean {
    return error.response?.status === 429 ||
           error.response?.status === 503 ||
           error.message?.toLowerCase().includes('rate limit');
  }

  private calculateBackoffDelay(retryCount: number): number {
    return Math.min(2000 * Math.pow(2, retryCount - 1), 10000);
  }

  async getIssueSubtypeId(projectId: string, accessToken: string) {
    const resp = await axios.get(`https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issue-types?include=subtypes`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    return resp.data.results[0].subtypes[0].id;
  }
}