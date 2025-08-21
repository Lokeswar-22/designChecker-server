import { Module } from '@nestjs/common';
import { RuleEngineService } from './rule-engine.service';
import { RuleEngineController } from './rule-engine.controller';
import { ACCAuthModule } from '../acc-auth/acc-auth.module';
import { HttpModule } from '@nestjs/axios';
import { IssueService } from 'src/shared/services/issue.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from 'src/shared/entities/issue.entity';
import { RequestService } from 'src/shared/services/request.service';
import { CacheModule } from '@nestjs/cache-manager';
import { Redis } from 'ioredis';

@Module({
  imports: [
    ACCAuthModule,
    HttpModule,
    TypeOrmModule.forFeature([Issue]),
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
