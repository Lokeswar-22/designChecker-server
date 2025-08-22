import { Module } from '@nestjs/common';
import { AccWebhookService } from './acc-webhook.service';
import { AccWebhookController } from './acc-webhook.controller';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [AccWebhookService],
  controllers: [AccWebhookController]
})
export class AccWebhookModule {}
