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

            this.accAuthService.setAuthCache(user.accUserId, response);

            res.json(response);
        }
    }

    @Post('sync')
    // @UseGuards(AuthGuard)
    async accSync(@Query('accUserId') accUserId: string, @Query('userID') userID: number) {
        const user = await this.accAuthService.accSync(accUserId, userID);
        return user;
    }

    @Post('check-acc-status')
    async checkAccStatus(@Body() body: { userID: number }) {
        const { userID } = body;
        
        if (!userID) {
            return {
                success: false,
                message: 'User ID is required',
                data: null
            };
        }

        try {
            const result = await this.accAuthService.userCheckAcc(userID);
            
            if (result.isAccSynced && result.isTokenValid) {
                return {
                    success: true,
                    message: 'User is synced with ACC and token is valid',
                    data: result
                };
            } else if (result.isAccSynced && !result.isTokenValid) {
                return {
                    success: false,
                    message: 'User is synced with ACC but token is invalid or expired',
                    data: result
                };
            } else {
                return {
                    success: false,
                    message: 'User is not synced with ACC',
                    data: result
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to check ACC status',
                data: null
            };
        }
    }

    @Get('token/:accUserId')
    async getToken(@Param('accUserId') accUserId: string) {
        const token = await this.accAuthService.refreshUserTokens(accUserId);
        return {
            access_token: token.accessToken,
            refresh_token: token.refreshToken,
            expires_at: token.expiresAt,
        };
    }

    @Get('profile/:accUserId')
    async getProfile(@Param('accUserId') accUserId: string) {
        const tokenData = await this.accAuthService.refreshUserTokens(accUserId);
        // const profile = await this.accAuthService.getUserProfile(tokenData.accessToken);
        //return { profile };
    }

    // @Get('validate/:accUserId')
    // async validateToken(@Param('accUserId') accUserId: string) {
    //     const isValid = await this.accAuthService.isTokenValid(accUserId);
    //     return {
    //         isValid,
    //         accUserId,
    //     };
    // }

    @Get('status')
    async getAuthStatus() {
        const cachedResponse = this.accAuthService.getLatestAuthCache();
        if (cachedResponse) {
            return cachedResponse;
        }
        return {
            message: 'User not found or not authenticated',
            accUserId: null,
        };
    }

    @Get('viewer-token')
    async getViewerToken() {
        const token = await this.accAuthService.getViewerToken();
        return {
            access_token: token.access_token,
            expires_in: token.expires_in,
        };
    }
}
