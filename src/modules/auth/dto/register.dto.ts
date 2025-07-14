import { IsEmail, IsString, MaxLength } from 'class-validator';

export class RegisterDto {

  @IsString()
  @MaxLength(25)
  firstName: string;

  @IsString()
  @MaxLength(25)
  lastName: string;

  @MaxLength(50)
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(15)
  password: string;
}
