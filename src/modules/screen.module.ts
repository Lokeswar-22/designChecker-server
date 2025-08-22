import { Module } from "@nestjs/common";
import {
    AuthModule,
    ACCAuthModule,
    HubsModule,
    UserModule,
    AccDocsUploadModule,
    AecDataModelModule,
    RuleEngineModule,
    DmDiscoveryModule
} from "./index";
import { AccWebhookModule } from './acc-webhook/acc-webhook.module';
import { RuleDataModule } from './rule-data/rule-data.module';


const MODULES = [
    AuthModule,
    ACCAuthModule,
    HubsModule,
    UserModule,
    AccDocsUploadModule,
    AecDataModelModule,
    RuleEngineModule,
    DmDiscoveryModule,
    AccWebhookModule,
    RuleDataModule
]

@Module({
    imports: MODULES,
    controllers: [],
    providers: [],
    exports: MODULES
})
export class ScreenModule { }
