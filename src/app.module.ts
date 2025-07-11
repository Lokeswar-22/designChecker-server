import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbConnectionModule } from './shared/config/db-connection.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { HubsModule } from './modules/hubs/hubs.module';
import { AccDocsUploadModule } from './modules/acc-docs-upload/acc-docs-upload.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DbConnectionModule,
    AuthModule,
    HubsModule,
    UserModule,
    AccDocsUploadModule,
  ],
})
export class AppModule {}
