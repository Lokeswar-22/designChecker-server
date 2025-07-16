import { IsString, IsNotEmpty } from 'class-validator';

export class CheckRuleDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  accUserId: string;

  @IsString()
  @IsNotEmpty()
  category: string;
} 