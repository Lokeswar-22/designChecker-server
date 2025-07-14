import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {

  @IsString()
  @MaxLength(50)
  @IsEmail()
  username?: string;

  @MaxLength(100)
  @IsString()
  password?: string;
}
