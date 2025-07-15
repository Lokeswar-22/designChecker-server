import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticationClient, ResponseType } from '@aps_sdk/authentication';
import { apsConfig } from '../../shared/config/aps.config';
import { ACCUser } from '../../shared/entities/acc-user.entity';
import { User } from 'src/shared/entities/user.entity';
import { RequestService } from 'src/shared/services/request.service';

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
    ) {}

    // Cache methods
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
            // Cache expires after 5 minutes
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
        
        // Get the most recent cached entry
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
        const accUserId = profile.userId;

        let accUser = await this.accUserRepository.findOne({ where: { accUserId } });
        const expirationTimestamp = Date.now() + (internalCredentials.expires_in * 1000);

        if (!accUser) {
            accUser = this.accUserRepository.create({
                accUserId,
                accessToken: internalCredentials.access_token,
                refreshToken: publicCredentials.refresh_token,
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
            accUserId: accUser.id
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

    async refreshUserTokens(accUserId: string): Promise<ACCUser> {
        const user = await this.accUserRepository.findOne({ where: { accUserId } });
        if (!user) throw new NotFoundException('User not found');

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
}
