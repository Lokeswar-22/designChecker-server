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
    private refreshPromises = new Map<string, Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }>>();
    private authenticationClient = new AuthenticationClient();
    private static authCache = new Map<string, { message: string; accUserId: string; timestamp: number }>();

    constructor(
        @InjectRepository(ACCUser)
        private readonly accUserRepository: Repository<ACCUser>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly requestService: RequestService,
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

    async getCurrentUserWithValidToken(accUserId: string): Promise<ACCUser> {
        const tokenData = await this.refreshUserTokens(accUserId);
        const user = await this.accUserRepository.findOne({ where: { accUserId } });
        
        if (!user) {
            throw new NotFoundException('ACC User not found');
        }

        user.accessToken = tokenData.accessToken;
        user.expiresAt = tokenData.expiresAt;
        
        return user;
    }

    async isTokenValid(accUserId: string): Promise<boolean> {
        const user = await this.accUserRepository.findOne({ where: { accUserId } });
        
        if (!user) {
            return false;
        }

        const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
        return user.expiresAt.getTime() > fiveMinutesFromNow;
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
        const user = await this.accUserRepository.findOne({ where: { accUserId } });
        if (!user) throw new NotFoundException('ACC User not found');
    
        const now = Date.now();
        if (user.expiresAt.getTime() > now + 5 * 60 * 1000) {
          return { accessToken: user.accessToken, refreshToken: user.refreshToken, expiresAt: user.expiresAt };
        }

        if (this.refreshPromises.has(accUserId)) {
            return await this.refreshPromises.get(accUserId) as { accessToken: string; refreshToken: string; expiresAt: Date };
        }

        const promise = this._doRefresh(user);
        this.refreshPromises.set(accUserId, promise);
        try {
          const result = await promise;
          return result;
        } finally {
          this.refreshPromises.delete(accUserId);
        }
      }
    
      private async _doRefresh(user: ACCUser) {
        try {
          const internal = await this.authenticationClient.refreshToken(
            user.refreshToken, apsConfig.APS_CLIENT_ID,
            { clientSecret: apsConfig.APS_CLIENT_SECRET, scopes: apsConfig.INTERNAL_TOKEN_SCOPES },
          );
    
          const pub = await this.authenticationClient.refreshToken(
            internal.refresh_token, apsConfig.APS_CLIENT_ID,
            { clientSecret: apsConfig.APS_CLIENT_SECRET, scopes: apsConfig.PUBLIC_TOKEN_SCOPES },
          );
    
          const expiresAt = new Date(Date.now() + internal.expires_in * 1000);
    
          user.accessToken = internal.access_token;
          user.refreshToken = pub.refresh_token;
          user.expiresAt = expiresAt;
          await this.accUserRepository.save(user);
    
          return { accessToken: internal.access_token, refreshToken: pub.refresh_token, expiresAt };
        } catch (err) {
          console.error('Token refresh failed', err);
          throw new UnauthorizedException('Refresh token invalid or expired – re-auth required.');
        }
      }
    
}
