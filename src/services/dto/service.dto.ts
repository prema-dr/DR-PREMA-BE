import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ParseJson, ToBoolean, Trim } from '../../common/decorators/transforms.js';

export class CreateServiceDto {
  @Trim() @IsString() @MinLength(2) @MaxLength(160)
  name: string;

  // Optional: generated from the name when omitted.
  @IsOptional() @Trim() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase letters, numbers and dashes' }) @MaxLength(150)
  slug?: string;

  @Trim() @IsString() @MaxLength(500)
  summary: string;

  @Trim() @IsString() @MaxLength(255)
  heroHeading: string;

  @Trim() @IsString() @MaxLength(500)
  heroSub: string;

  @IsOptional() @Trim() @IsString() @MaxLength(60)
  iconKey?: string;

  // Landing page body: { sections: [], faqs: [], closing: [] }
  @IsOptional() @ParseJson() @IsObject()
  content?: Record<string, unknown>;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateServiceDto {
  @IsOptional() @Trim() @IsString() @MinLength(2) @MaxLength(160)
  name?: string;

  @IsOptional() @Trim() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase letters, numbers and dashes' }) @MaxLength(150)
  slug?: string;

  @IsOptional() @Trim() @IsString() @MaxLength(500)
  summary?: string;

  @IsOptional() @Trim() @IsString() @MaxLength(255)
  heroHeading?: string;

  @IsOptional() @Trim() @IsString() @MaxLength(500)
  heroSub?: string;

  @IsOptional() @Trim() @IsString() @MaxLength(60)
  iconKey?: string;

  @IsOptional() @ParseJson() @IsObject()
  content?: Record<string, unknown>;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}

export class ReorderServicesDto {
  // Service ids in the desired display order.
  @IsArray() @ArrayNotEmpty() @Type(() => Number) @IsInt({ each: true })
  ids: number[];
}
