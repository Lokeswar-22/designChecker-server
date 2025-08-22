import { Module } from '@nestjs/common';
import { DmDiscoveryController } from './dm-discovery.controller';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [DmDiscoveryController]
})
export class DmDiscoveryModule {}
