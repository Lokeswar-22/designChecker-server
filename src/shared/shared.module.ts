import { Module } from "@nestjs/common"
import { DbConnectionModule, JWTService, IssueService, RequestService } from "./index";
import { HttpModule } from "@nestjs/axios";
import { ACCAuthService } from "src/modules/acc-auth/acc-auth.service";
import { UserService } from "src/modules/user/user.service";
import { AuthService } from "src/modules/auth/auth.service";
import { AccDocsUploadService } from "src/modules/acc-docs-upload/acc-docs-upload.service";
import { AecDataModelService } from "src/modules/aec-data-model/aec-data-model.service";
import { RuleEngineService } from "src/modules/rule-engine/rule-engine.service";
import { HubsService } from "src/modules/hubs/hubs.service";
import { Redis } from "ioredis";
import { DmDiscoveryService } from "src/modules/dm-discovery/dm-discovery.service";

const MODULES = [
    DbConnectionModule,
    HttpModule,
]

const SERVICES = [
    JWTService,
    IssueService,
    RequestService,
    ACCAuthService,
    UserService,
    AuthService,
    AccDocsUploadService,
    AecDataModelService,
    RuleEngineService,
    HubsService,
    Redis,
    DmDiscoveryService
]

@Module({
    imports: [...MODULES],
    controllers: [],
    providers: [...SERVICES],
    exports: [...MODULES, ...SERVICES]
})
export class SharedModule { }