import { Controller, Get, Query, Res, Param, UseGuards, Post, Body } from '@nestjs/common';
import { Response } from 'express';
import { ACCAuthService } from './acc-auth.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';

@Controller('api/acc-auth')
// @UseGuards(AuthGuard)
export class ACCAuthController {
    constructor(private readonly accAuthService: ACCAuthService) {}

    @Get('login')
    login(@Res() res: Response) {
        const url = this.accAuthService.getAuthorizationUrl();
        res.redirect(url);
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Res() res: Response) {
        const user = await this.accAuthService.handleAuthCallback(code);
        res.json({
            message: 'Successfully logged in, redirecting to home page ...',
            accUserId: user.accUserId,
        });
    }

    @Post('sync')
    @UseGuards(AuthGuard)
    async accSync(@Query('accUserId') accUserId: string) {
        const user = await this.accAuthService.accSync(accUserId);
        return user;
    }

    @Get('token/:accUserId')
    async getToken(@Param('accUserId') accUserId: string) {
        const user = await this.accAuthService.refreshUserTokens(accUserId);
        return {
            access_token: user.accessToken,
            expires_at: user.expiresAt,
        };
    }

    @Get('profile/:accUserId')
    async getProfile(@Param('accUserId') accUserId: string) {
        const user = await this.accAuthService.refreshUserTokens(accUserId);
        const profile = await this.accAuthService.getUserProfile(user.accessToken);
        return { profile };
    }
}
