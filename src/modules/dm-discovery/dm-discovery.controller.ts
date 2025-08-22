import { Body,  Controller, Get, Query } from '@nestjs/common';
import { DmDiscoveryService } from './dm-discovery.service';

@Controller('dm-discovery')
export class DmDiscoveryController {
    constructor(
        private readonly dmDiscoveryService: DmDiscoveryService
    ) {}

    @Get('checkStatus')
    checkStatus(
        @Query('accUserId') accUserId: string
    ) {
        return this.dmDiscoveryService.checkStatus(accUserId);
    }

    @Get('syncData')
    syncData(
        @Query('accUserId') accUserId: string
    ) {
        return this.dmDiscoveryService.initiateCrawlData(accUserId);
    }


}
