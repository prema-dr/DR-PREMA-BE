import { Type } from 'class-transformer';
import {
  IsBoolean, IsDate, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength,
} from 'class-validator';
import { EmptyToNull, NormalizePath, ToBoolean, Trim } from '../../common/decorators/transforms.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REWRITE = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/;

export class CreateBlogDto {
  @Trim() @IsString() @MinLength(3) @MaxLength(255)
  title: string;

  // The service/category decides which service page the blog appears on.
  @Type(() => Number) @IsInt()
  serviceId: number;

  @IsOptional() @Trim() @IsString() @Matches(SLUG, { message: 'slug must be lowercase letters, numbers and dashes' }) @MaxLength(180)
  slug?: string;

  @IsOptional() @NormalizePath() @Matches(REWRITE, { message: 'urlRewrite may contain lowercase letters, numbers, dashes and slashes' }) @MaxLength(191)
  urlRewrite?: string | null;

  @IsOptional() @EmptyToNull() @Trim() @IsString() @MaxLength(255)
  metaTitle?: string | null;

  @IsOptional() @EmptyToNull() @Trim() @IsString() @MaxLength(500)
  metaDescription?: string | null;

  @IsOptional() @EmptyToNull() @Trim() @IsString() @MaxLength(255)
  imageAlt?: string | null;

  // HTML from the rich-text editor; sanitised server-side.
  @IsString() @MinLength(10)
  content: string;

  @IsOptional() @Trim() @IsString() @MaxLength(500)
  excerpt?: string;

  // A future date schedules the post: it goes live once the date passes.
  @IsOptional() @Type(() => Date) @IsDate()
  publishDate?: Date;

  @IsOptional() @ToBoolean() @IsBoolean()
  isPublished?: boolean;
}

export class UpdateBlogDto {
  @IsOptional() @Trim() @IsString() @MinLength(3) @MaxLength(255)
  title?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  serviceId?: number;

  @IsOptional() @Trim() @IsString() @Matches(SLUG, { message: 'slug must be lowercase letters, numbers and dashes' }) @MaxLength(180)
  slug?: string;

  @IsOptional() @NormalizePath() @Matches(REWRITE, { message: 'urlRewrite may contain lowercase letters, numbers, dashes and slashes' }) @MaxLength(191)
  urlRewrite?: string | null;

  @IsOptional() @EmptyToNull() @Trim() @IsString() @MaxLength(255)
  metaTitle?: string | null;

  @IsOptional() @EmptyToNull() @Trim() @IsString() @MaxLength(500)
  metaDescription?: string | null;

  @IsOptional() @EmptyToNull() @Trim() @IsString() @MaxLength(255)
  imageAlt?: string | null;

  @IsOptional() @IsString() @MinLength(10)
  content?: string;

  @IsOptional() @Trim() @IsString() @MaxLength(500)
  excerpt?: string;

  @IsOptional() @Type(() => Date) @IsDate()
  publishDate?: Date;

  @IsOptional() @ToBoolean() @IsBoolean()
  isPublished?: boolean;
}

export class PublishBlogDto {
  @ToBoolean() @IsBoolean()
  isPublished: boolean;
}

export class AdminBlogQueryDto extends PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt()
  serviceId?: number;

  @IsOptional() @IsIn(['published', 'draft'])
  status?: 'published' | 'draft';
}
