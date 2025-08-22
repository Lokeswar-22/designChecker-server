import { Module } from "@nestjs/common";
import {
    AuthModule,
    ACCAuthModule,
    HubsModule,
    UserModule,
    AccDocsUploadModule,
    AecDataModelModule,
    RuleEngineModule
} from "./index";


const MODULES = [
    AuthModule,
    ACCAuthModule,
    HubsModule,
    UserModule,
    AccDocsUploadModule,
    AecDataModelModule,
    RuleEngineModule,

]

@Module({
    imports: MODULES,
    controllers: [],
    providers: [],
    exports: MODULES
})
export class ScreenModule { }
