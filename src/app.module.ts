import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { SharedModule } from './shared/shared.module';
import { ScreenModule } from './modules/screen.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    SharedModule,
    ScreenModule,
    CacheModule.register({
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    })
  ],
  controllers: [],
})
export class AppModule {}
