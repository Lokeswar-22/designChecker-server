import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCUser } from '../entities/acc-user.entity';
import { User } from '../entities/user.entity';
import * as config from 'dotenv';
import { Document } from '../entities/document.entity';
import { APSToken } from '../entities/aps-token.entity';
import { Issue } from '../entities/issue.entity';

config.config();

const entities = [
  User,
  ACCUser,
  Document,
  APSToken,
  Issue
]
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DATABASE as any,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: entities,
      synchronize: true,
      logging: false,
      requestTimeout: 60000,
      pool: {
        max: 1000,
        min: 2,
        idleTimeoutMillis: 30000,
      },
      extra: {
        trustServerCertificate: true,
        connectionTimeoutMillis: 50000,
      },
    }),
    TypeOrmModule.forFeature(entities)
  ],
  exports: [TypeOrmModule]
})
export class DbConnectionModule { }
