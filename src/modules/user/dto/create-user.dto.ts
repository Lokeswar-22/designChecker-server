import {
  IsEmail,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {

    @IsString()
    @MaxLength(25)
    firstName: string;

    @IsString()
    @MaxLength(25)
    lastName: string;

    @IsEmail()
    @MaxLength(50)
    email: string;

    @IsString()
    @MaxLength(50)
    password: string;

}
