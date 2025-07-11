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
            accUserId: user.accUserId,
        });
    }

    @Get('token/:accUserId')
    async getToken(@Param('accUserId') accUserId: string) {
        const user = await this.authService.refreshUserTokens(accUserId);
        return {
            access_token: user.accessToken,
            expires_at: user.expiresAt,
        };
    }

    @Get('profile/:accUserId')
    async getProfile(@Param('accUserId') accUserId: string) {
        const user = await this.authService.refreshUserTokens(accUserId);
        const profile = await this.authService.getUserProfile(user.accessToken);
        return { profile };
    }
}
