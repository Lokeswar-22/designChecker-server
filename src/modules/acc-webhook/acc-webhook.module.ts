import { Module } from '@nestjs/common';
import { AccWebhookService } from './acc-webhook.service';
import { AccWebhookController } from './acc-webhook.controller';

@Module({
  providers: [AccWebhookService],
  controllers: [AccWebhookController]
})
export class AccWebhookModule {}
