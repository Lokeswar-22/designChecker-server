import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, Min, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(20)
  extension: string;

  @IsNumber()
  @Min(0)
  size: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mimetype?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  storageUrn?: string;

  @IsString()
  @MaxLength(255)
  hubId: string;

  @IsString()
  @MaxLength(255)
  projectId: string;

  @IsArray()
  @IsString({ each: true })
  folderIds: string[];

  @IsOptional()
  @IsBoolean()
  inAccDocs?: boolean;
} 