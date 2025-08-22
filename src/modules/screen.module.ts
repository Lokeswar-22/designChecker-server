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


const MODULES = [
    AuthModule,
    ACCAuthModule,
    HubsModule,
    UserModule,
    AccDocsUploadModule,
    AecDataModelModule,
    RuleEngineModule,
    DmDiscoveryModule
]

@Module({
    imports: MODULES,
    controllers: [],
    providers: [],
    exports: MODULES
})
export class ScreenModule { }
