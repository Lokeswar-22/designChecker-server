import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ACCUser } from '../../shared/entities/acc-user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ACCUser])],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {}
