import { Module } from '@nestjs/common';
import { ACCAuthController } from './acc-auth.controller';
import { ACCAuthService } from './acc-auth.service';
import { JWTService } from '../../shared/services/jwt.service';
import { UserService } from '../user/user.service';
import { RequestService } from '../../shared/services/request.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
    imports: [SharedModule],
    controllers: [ACCAuthController],
    providers: [ACCAuthService, JWTService, UserService, RequestService],
    exports: [ACCAuthService]
})
export class ACCAuthModule {}
