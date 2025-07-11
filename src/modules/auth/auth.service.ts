import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticationClient, ResponseType } from '@aps_sdk/authentication';
import { apsConfig } from '../../shared/config/aps.config';
import { ACCUser } from '../../shared/entities/acc-user.entity';

@Injectable()
export class AuthService {
    private authenticationClient = new AuthenticationClient();

    constructor(
        @InjectRepository(ACCUser)
        private readonly accUserRepository: Repository<ACCUser>,
    ) {}

    getAuthorizationUrl(): string {
        return this.authenticationClient.authorize(
            apsConfig.APS_CLIENT_ID,
            ResponseType.Code,
            apsConfig.APS_CALLBACK_URL,
            apsConfig.INTERNAL_TOKEN_SCOPES,
        );
    }

    async handleAuthCallback(code: string): Promise<ACCUser> {
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
        const accUserId = profile.userId; // adjust key based on actual APS profile response

        let user = await this.accUserRepository.findOne({ where: { accUserId } });
        const expirationTimestamp = Date.now() + (internalCredentials.expires_in * 1000);

        if (!user) {
            user = this.accUserRepository.create({
                accUserId,
                accessToken: internalCredentials.access_token,
                refreshToken: publicCredentials.refresh_token,
                expiresAt: new Date(expirationTimestamp),
            });
        } else {
            user.accessToken = internalCredentials.access_token;
            user.refreshToken = publicCredentials.refresh_token;
            user.expiresAt = new Date(expirationTimestamp);
        }

        await this.accUserRepository.save(user);

        return user;
    }

    async refreshUserTokens(accUserId: string): Promise<ACCUser> {
        const user = await this.accUserRepository.findOne({ where: { accUserId } });
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

            const expirationTimestamp = Date.now() + (internalCredentials.expires_in * 1000);

            user.accessToken = internalCredentials.access_token;
            user.refreshToken = publicCredentials.refresh_token;
            user.expiresAt = new Date(expirationTimestamp);

            await this.accUserRepository.save(user);
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
