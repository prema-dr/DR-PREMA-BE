import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ToBoolean, Trim } from '../../common/decorators/transforms.js';

export class CreateGalleryImageDto {
  @Type(() => Number) @IsInt()
  serviceId: number;

  // Alt text is mandatory for every image (accessibility + SEO).
  @Trim() @IsString() @MinLength(3) @MaxLength(255)
  altText: string;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateGalleryImageDto {
  @IsOptional() @Type(() => Number) @IsInt()
  serviceId?: number;

  @IsOptional() @Trim() @IsString() @MinLength(3) @MaxLength(255)
  altText?: string;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}
