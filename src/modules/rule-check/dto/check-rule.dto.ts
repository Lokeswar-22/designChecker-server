import { IsString, IsNotEmpty } from 'class-validator';

export class CheckRuleDto {
  @IsString()
  @IsNotEmpty()
  elementGroupId: string;

  @IsString()
  @IsNotEmpty()
  accUserId: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  projectId: string;
} 