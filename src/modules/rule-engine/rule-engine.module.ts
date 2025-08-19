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
      //ttl: 60000,
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
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      }),
    }
  ]
})
export class RuleEngineModule {}
