import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticationClient, ResponseType } from '@aps_sdk/authentication';
import { apsConfig } from '../../shared/config/aps.config';
import { ACCUser } from '../../shared/entities/acc-user.entity';
import { User } from 'src/shared/entities/user.entity';
import { RequestService } from 'src/shared/services/request.service';
import { APSToken } from 'src/shared/entities/aps-token.entity';

@Injectable()
export class ACCAuthService {
    private authenticationClient = new AuthenticationClient();
    private static authCache = new Map<string, { message: string; accUserId: string; timestamp: number }>();

    constructor(
        @InjectRepository(ACCUser)
        private readonly accUserRepository: Repository<ACCUser>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly requestService: RequestService,
        @InjectRepository(APSToken)
        private readonly apsTokenRepository: Repository<APSToken>,
    ) {}

    setAuthCache(accUserId: string, response: { message: string; accUserId: string }) {
        ACCAuthService.authCache.set(accUserId, {
            ...response,
            timestamp: Date.now()
        });
        console.log("Cached auth response for:", accUserId, response);
    }

    getAuthCache(accUserId: string) {
        const cached = ACCAuthService.authCache.get(accUserId);
        if (cached) {
            const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
            if (!isExpired) {
                console.log("Returning cached auth response for:", accUserId);
                return { message: cached.message, accUserId: cached.accUserId };
            } else {
                ACCAuthService.authCache.delete(accUserId);
            }
        }
        return null;
    }

    clearAuthCache(accUserId: string) {
        ACCAuthService.authCache.delete(accUserId);
    }

    getLatestAuthCache() {
        if (ACCAuthService.authCache.size === 0) {
            return null;
        }

        let latestEntry: { message: string; accUserId: string } | null = null;
        let latestTimestamp = 0;

        for (const [accUserId, cached] of ACCAuthService.authCache.entries()) {
            if (cached.timestamp > latestTimestamp) {
                latestTimestamp = cached.timestamp;
                latestEntry = { message: cached.message, accUserId: cached.accUserId };
            }
        }

        return latestEntry;
    }

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

        const profile = await this.getUserProfile(internalCredentials.access_token);
        console.log("profile : ", profile);

        let accUser = await this.accUserRepository.findOne({ where: { accUserId: profile.userId } });
        const expirationTimestamp = Date.now() + (internalCredentials.expires_in * 1000);

        const apsToken = this.apsTokenRepository.create({
            accUserId: profile.userId,
            accessToken: internalCredentials.access_token,
            refreshToken: publicCredentials.refresh_token,
            expiresAt: new Date(expirationTimestamp),
            createdAt: new Date(),
        });

        await this.apsTokenRepository.save(apsToken);


        if (!accUser) {
            accUser = this.accUserRepository.create({
                accUserId: profile.userId,
                accessToken: internalCredentials.access_token,
                refreshToken: publicCredentials.refresh_token,
                accUserName: profile.userName,
                accEmail: profile.emailId,
                expiresAt: new Date(expirationTimestamp),
                createdAt: new Date(),
            });
        } else {
            accUser.accessToken = internalCredentials.access_token;
            accUser.refreshToken = publicCredentials.refresh_token;
            accUser.expiresAt = new Date(expirationTimestamp);
            accUser.modifiedAt = new Date();
        }

        await this.accUserRepository.save(accUser);
        return accUser;
    }

    async accSync(accUserId: string): Promise<any> {
        const userID = this.requestService.getUser().userID;
        const user = await this.userRepository.findOne({ where: { userID } });
        if (!user) throw new NotFoundException('User not found');
        const accUser = await this.accUserRepository.findOne({ where: { accUserId } });
        if (!accUser) throw new NotFoundException('ACC User not found');

        await this.userRepository.update(user.userID, {
            isAccSynced: true,
            accUserId: accUser.accUserId
        });

        const updatedUser = await this.userRepository.findOne({
            where: { userID },
            relations: ['accUser']
        });

        return {
            message: 'Account synchronization successful',
            user: updatedUser,
        };
    }

    async getUserProfile(accessToken: string): Promise<any> {
        const response = await fetch('https://developer.api.autodesk.com/userprofile/v1/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new UnauthorizedException('Failed to fetch user profile');
        }
        return response.json();
    }

    async checkAuthStatus(accUserId: string): Promise<{ message: string; accUserId: string }> {
        const accUser = await this.accUserRepository.findOne({ where: { accUserId } });

        if (!accUser) {
            throw new NotFoundException('User not found or not authenticated');
        }

        return {
            message: 'Authentication successful',
            accUserId: accUser.accUserId,
        };
    }
    async refreshUserTokens(accUserId: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
        const apsToken = await this.apsTokenRepository.findOne({ where: { accUserId }, order: { createdAt: 'DESC' } });
        if (!apsToken) throw new NotFoundException('APS Token not found for this ACC user');

        const now = Date.now();
        const tokenExpiryTime = apsToken.expiresAt.getTime();

        if (tokenExpiryTime > now + 5 * 60 * 1000) {
            return {
                accessToken: apsToken.accessToken,
                refreshToken: apsToken.refreshToken,
                expiresAt: apsToken.expiresAt
            };
        }

        try {
            const newCredentials = await this.authenticationClient.refreshToken(
                apsToken.refreshToken,
                apsConfig.APS_CLIENT_ID,
                {
                    clientSecret: apsConfig.APS_CLIENT_SECRET,
                    scopes: apsConfig.INTERNAL_TOKEN_SCOPES
                }
            );

            const expirationTimestamp = Date.now() + (newCredentials.expires_in * 1000);
            const newExpiresAt = new Date(expirationTimestamp);

            await this.apsTokenRepository.update(
                { apsTokenID: apsToken.apsTokenID },
                {
                    accessToken: newCredentials.access_token,
                    refreshToken: newCredentials.refresh_token || apsToken.refreshToken,
                    expiresAt: newExpiresAt
                }
            );

            return {
                accessToken: newCredentials.access_token,
                refreshToken: newCredentials.refresh_token || apsToken.refreshToken,
                expiresAt: newExpiresAt
            };
        } catch (error) {
            console.error('Failed to refresh token for accUserId:', accUserId, error);
            throw new UnauthorizedException('Failed to refresh access token. User needs to re-authenticate.');
        }
    }

    async getValidAccessToken(accUserId: string): Promise<string> {
        try {
            const tokenData = await this.refreshUserTokens(accUserId);
            return tokenData.accessToken;
        } catch (error) {
            console.error('Error getting valid access token for accUserId:', accUserId, error);
            throw error;
        }
    }

    // async isTokenValid(accUserId: string): Promise<boolean> {
    //     try {
    //         const apsToken = await this.apsTokenRepository.findOne({ where: { accUserId } });
    //         if (!apsToken) return false;

    //         const now = Date.now();
    //         const tokenExpiryTime = apsToken.expiresAt.getTime();

    //         // Token is valid if it expires in more than 5 minutes
    //         return tokenExpiryTime > now + 5 * 60 * 1000;
    //     } catch (error) {
    //         console.error('Error checking token validity for accUserId:', accUserId, error);
    //         return false;
    //     }
    // }
}
