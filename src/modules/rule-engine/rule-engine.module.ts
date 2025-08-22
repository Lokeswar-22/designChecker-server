import { Module } from '@nestjs/common';
import { RuleEngineService } from './rule-engine.service';
import { RuleEngineController } from './rule-engine.controller';
import { IssueService } from 'src/shared/services/issue.service';
import { RequestService } from 'src/shared/services/request.service';
import { CacheModule } from '@nestjs/cache-manager';
import { Redis } from 'ioredis';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    CacheModule.register({
    })
  ],
  controllers: [RuleEngineController],
  providers: [
    RuleEngineService,
    IssueService,
    RequestService,
    {
      provide: Redis,
      useFactory: () => new Redis({
        host: 'localhost',
        port: parseInt('6379'),
        //password:'LokiKKM'
      }),
    }
  ]
})
export class RuleEngineModule {}
