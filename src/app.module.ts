import { Module } from '@nestjs/common';
import { DbConnectionModule } from './shared/config/db-connection.module';
import { ConfigModule } from '@nestjs/config';
import { ACCAuthModule } from './modules/acc-auth/acc-auth.module';
import { HubsModule } from './modules/hubs/hubs.module';
import { AccDocsUploadModule } from './modules/acc-docs-upload/acc-docs-upload.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AecDataModelModule } from './modules/aec-data-model/aec-data-model.module';
import { RuleEngineModule } from './modules/rule-engine/rule-engine.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    DbConnectionModule,
    AuthModule,
    ACCAuthModule,
    HubsModule,
    UserModule,
    AccDocsUploadModule,
    AecDataModelModule,
    RuleEngineModule,

  ],
  controllers: [],
})
export class AppModule {}
