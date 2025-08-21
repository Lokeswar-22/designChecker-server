import {
    Body,
    Controller,
    Headers,
    Param,
    Patch,
    Post,
    Query,
    Res,
    UseFilters
  } from '@nestjs/common';
  import { Response } from 'express';
  import { LoginDto } from './dto/login.dto';
  import { RegisterDto } from './dto/register.dto';
  import { AuthService } from './auth.service';
  import { constructResponse } from 'src/shared/utils/helpers';

  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(
      @Body() registerDto: RegisterDto,
      @Res({ passthrough: true }) response: Response,
    ) {
      return this.authService.register(registerDto).then((result: any) => {
        if (result.hash) return constructResponse(true, result, 200);
        return constructResponse(true, result, 200);
      });
    }

    @Post('login')
    login(
      @Body() loginDto: LoginDto,
      @Res({ passthrough: true }) response: Response,
    ) {
      return this.authService.login(loginDto).then((result) => {
        return constructResponse(true, result, 200);
      }).catch(err => (constructResponse(false, { message: err?.message }, 401)));
    }
  }
