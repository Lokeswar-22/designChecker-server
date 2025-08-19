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
                host: '127.0.0.1',
                port: parseInt('6379'),
                password:'LokiKKM#321',                
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                connectTimeout: 10000,
            });

            this.redisClient.on('connect', () => {
                console.log('Redis connected successfully');
                this.isRedisConnected = true;
            });

            this.redisClient.on('ready', () => {
                console.log('Redis is ready');
                this.isRedisConnected = true;
            });

            this.redisClient.on('error', (error) => {
                console.error('Redis connection error:', error);
                this.isRedisConnected = false;
            });

            this.redisClient.on('close', () => {
                console.log('Redis connection closed');
                this.isRedisConnected = false;
            });

            this.redisClient.on('reconnecting', () => {
                console.log('Redis reconnecting...');
                this.isRedisConnected = false;
            });

            await this.redisClient.connect();
        } catch (error) {
            console.error('Failed to initialize Redis:', error);
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
            console.log('Redis not connected, skipping cache for:', request.url);
            return next.handle();
        }

        const cacheKey = this.generateCacheKey(request);

        try {
            const cachedResponse = await this.redisClient.get(cacheKey);
            if (cachedResponse) {
                console.log('Cache hit for:', request.url);
                return of(JSON.parse(cachedResponse));
            }
        } catch (error) {
            console.error('Redis GET Error:', error);

        }

        console.log('Cache miss for:', request.url);
        return next.handle().pipe(
            tap(async (response) => {
                if (this.isRedisConnected && this.redisClient) {
                    try {
                        await this.redisClient.set(cacheKey, JSON.stringify(response), 'EX', 600);
                        console.log('Cached response for:', request.url);
                    } catch (error) {
                        console.error('Redis SET Error:', error);
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