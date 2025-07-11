import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCUser } from '../entities/acc-user.entity';
import { User } from '../entities/user.entity';
import * as config from 'dotenv';

config.config();

const entities = [
  User,
  ACCUser,
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
      // logging: true,
      entities: entities,
      synchronize: true,
      logging: false,
      requestTimeout: 60000,
      pool: {
        max: 1000, // Max number of connections
        min: 2, // Min number of connections
        idleTimeoutMillis: 30000, // How long a connection can sit idle before being released (30 seconds)
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
