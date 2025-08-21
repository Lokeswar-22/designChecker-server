import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import Redis from 'ioredis';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
    private redisClient: Redis | null = null;
    private isRedisConnected = false;

    constructor() {
        this.initializeRedis();
    }

    private async initializeRedis() {
        try {
            this.redisClient = new Redis({
                host: '192.168.40.177',
                port: parseInt('6379'),
                password:'LokiKKM',                
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                connectTimeout: 10000,
            });

            this.redisClient.on('connect', () => {
                this.isRedisConnected = true;
            });

            this.redisClient.on('ready', () => {
                this.isRedisConnected = true;
            });

            this.redisClient.on('error', (error) => {
                this.isRedisConnected = false;
            });

            this.redisClient.on('close', () => {
                this.isRedisConnected = false;
            });

            this.redisClient.on('reconnecting', () => {
                this.isRedisConnected = false;
            });

            await this.redisClient.connect();
        } catch (error) {
            this.isRedisConnected = false;
        }
    }

    private generateCacheKey(request: any): string {
        return `Cache Key:${request.method}:${request.url}`;
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();


        if (request.url.includes('auth/identitycheck') || request.method !== 'GET') {
            return next.handle();
        }

        if (!this.isRedisConnected || !this.redisClient) {
            return next.handle();
        }

        const cacheKey = this.generateCacheKey(request);

        try {
            const cachedResponse = await this.redisClient.get(cacheKey);
            if (cachedResponse) {
                return of(JSON.parse(cachedResponse));
            }
        } catch (error) {

        }

        return next.handle().pipe(
            tap(async (response) => {
                if (this.isRedisConnected && this.redisClient) {
                    try {
                        await this.redisClient.set(cacheKey, JSON.stringify(response), 'EX', 600);
                    } catch (error) {
                    }
                }
            }),
        );
    }

    async onModuleDestroy() {
        if (this.redisClient) {
            await this.redisClient.quit();
        }
    }
}