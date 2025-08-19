import { Module } from '@nestjs/common';
import { RuleEngineService } from './rule-engine.service';
import { RuleEngineController } from './rule-engine.controller';
import { ACCAuthModule } from '../acc-auth/acc-auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ACCAuthModule,HttpModule],
  controllers: [RuleEngineController],
  providers: [RuleEngineService]
})
export class RuleEngineModule {}
