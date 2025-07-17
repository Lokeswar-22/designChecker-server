import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCAuthController } from './acc-auth.controller';
import { ACCAuthService } from './acc-auth.service';
import { ACCUser } from '../../shared/entities/acc-user.entity';
import { User } from '../../shared/entities/user.entity';
import { JWTService } from '../../shared/services/jwt.service';
import { UserService } from '../user/user.service';
import { RequestService } from '../../shared/services/request.service';
import { APSToken } from '../../shared/entities/aps-token.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ACCUser, User, APSToken])],
    controllers: [ACCAuthController],
    providers: [ACCAuthService, JWTService, UserService, RequestService],
    exports: [ACCAuthService]
})
export class ACCAuthModule {}
