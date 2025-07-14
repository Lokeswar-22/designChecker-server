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
        if(user){
            const response = {
                message: 'Successfully logged in, redirecting to home page ...',
                accUserId: user.accUserId,
            };

            console.log("Response object:", response);
            // Store in proper cache
            this.accAuthService.setAuthCache(user.accUserId, response);

            res.json(response);
        }
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

    @Get('status')
    async getAuthStatus() {
        // If we have cached response from callback, return it
        console.log("CALLED")
        const cachedResponse = this.accAuthService.getLatestAuthCache();
        if (cachedResponse) {
            console.log("Returning cached response:", cachedResponse);
            return cachedResponse;
        }

        // If no cached response, return not authenticated
        return {
            message: 'User not found or not authenticated',
            accUserId: null,
        };
    }
}
