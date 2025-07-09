import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticationClient, ResponseType } from '@aps_sdk/authentication';
import { apsConfig } from '../config/aps.config';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
    private authenticationClient = new AuthenticationClient();

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    getAuthorizationUrl(): string {
        return this.authenticationClient.authorize(
            apsConfig.APS_CLIENT_ID,
            ResponseType.Code,
            apsConfig.APS_CALLBACK_URL,
            apsConfig.INTERNAL_TOKEN_SCOPES,
        );
    }

    async handleAuthCallback(code: string): Promise<User> {
        const internalCredentials = await this.authenticationClient.getThreeLeggedToken(
            apsConfig.APS_CLIENT_ID,
            code,
            apsConfig.APS_CALLBACK_URL,
            { clientSecret: apsConfig.APS_CLIENT_SECRET },
        );

        const publicCredentials = await this.authenticationClient.refreshToken(
            internalCredentials.refresh_token,
            apsConfig.APS_CLIENT_ID,
            { clientSecret: apsConfig.APS_CLIENT_SECRET, scopes: apsConfig.PUBLIC_TOKEN_SCOPES },
        );

        // Fetch user profile to get a unique identifier
        const profile = await this.getUserProfile(internalCredentials.access_token);
        const apsUserId = profile.userId; // adjust key based on actual APS profile response

        let user = await this.userRepository.findOne({ where: { apsUserId } });

        if (!user) {
            user = this.userRepository.create({
                apsUserId,
                accessToken: internalCredentials.access_token,
                refreshToken: publicCredentials.refresh_token,
                expiresAt: new Date(Date.now() + internalCredentials.expires_in * 1000),
            });
        } else {
            user.accessToken = internalCredentials.access_token;
            user.refreshToken = publicCredentials.refresh_token;
            user.expiresAt = new Date(Date.now() + internalCredentials.expires_in * 1000);
        }

        await this.userRepository.save(user);

        return user;
    }

    async refreshUserTokens(apsUserId: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { apsUserId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.expiresAt.getTime() < Date.now()) {
            const internalCredentials = await this.authenticationClient.refreshToken(
                user.refreshToken,
                apsConfig.APS_CLIENT_ID,
                { clientSecret: apsConfig.APS_CLIENT_SECRET, scopes: apsConfig.INTERNAL_TOKEN_SCOPES },
            );

            const publicCredentials = await this.authenticationClient.refreshToken(
                internalCredentials.refresh_token,
                apsConfig.APS_CLIENT_ID,
                { clientSecret: apsConfig.APS_CLIENT_SECRET, scopes: apsConfig.PUBLIC_TOKEN_SCOPES },
            );

            user.accessToken = internalCredentials.access_token;
            user.refreshToken = publicCredentials.refresh_token;
            user.expiresAt = new Date(Date.now() + internalCredentials.expires_in * 1000);

            await this.userRepository.save(user);
        }

        return user;
    }

    async getUserProfile(accessToken: string): Promise<any> {
        // Replace this with actual APS API call to retrieve user profile
        // Example using fetch:
        const response = await fetch('https://developer.api.autodesk.com/userprofile/v1/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new UnauthorizedException('Failed to fetch user profile');
        }
        return response.json();
    }
}
