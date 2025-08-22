import { Injectable } from "@nestjs/common";
import { DmDiscoveryService } from "../dm-discovery/dm-discovery.service";

@Injectable()
export class AccWebhookService {

    constructor(
        private readonly dmDiscoveryService: DmDiscoveryService
    ) {}

}