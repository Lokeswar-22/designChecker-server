import { Controller, Get, Query, Res, Param, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('login')
    login(@Res() res: Response) {
        const url = this.authService.getAuthorizationUrl();
        res.redirect(url);
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Res() res: Response) {
        const user = await this.authService.handleAuthCallback(code);
        res.json({
            message: 'Authentication successful',
            apsUserId: user.apsUserId,
        });
    }

    @Get('token/:apsUserId')
    async getToken(@Param('apsUserId') apsUserId: string) {
        const user = await this.authService.refreshUserTokens(apsUserId);
        return {
            access_token: user.accessToken,
            expires_at: user.expiresAt,
        };
    }

    @Get('profile/:apsUserId')
    async getProfile(@Param('apsUserId') apsUserId: string) {
        const user = await this.authService.refreshUserTokens(apsUserId);
        const profile = await this.authService.getUserProfile(user.accessToken);
        return { profile };
    }
}
