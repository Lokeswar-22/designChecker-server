import { IsString, IsNotEmpty, IsArray } from 'class-validator';

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

  @IsArray()
  @IsNotEmpty()
  linkedDocuments: string[];
}