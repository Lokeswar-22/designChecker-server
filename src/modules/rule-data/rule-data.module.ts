import { Module } from '@nestjs/common';
import { RuleDataController } from './rule-data.controller';
import { SharedModule } from 'src/shared/shared.module';
import { RuleDataService } from './rule-data.service';
import { RuleDataHelperService } from './rule-data.helperService';

@Module({
  imports: [SharedModule],
  controllers: [RuleDataController],
  providers: [RuleDataService, RuleDataHelperService]
})
export class RuleDataModule {}
