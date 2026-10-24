import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { ToBoolean, Trim } from '../../common/decorators/transforms.js';

const URL_OPTS = { protocols: ['http', 'https'], require_protocol: true };

export class CreatePublicationDto {
  @Trim() @IsString() @MinLength(3) @MaxLength(255)
  title: string;

  @Type(() => Number) @IsInt()
  serviceId: number;

  @Trim() @IsString() @MinLength(5) @MaxLength(500)
  shortDescription: string;

  // Google Scholar, journal site, patent page, etc. Opens in a new tab on the website.
  @Trim() @IsUrl(URL_OPTS, { message: 'url must be a valid http(s) link' }) @MaxLength(500)
  url: string;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}

export class UpdatePublicationDto {
  @IsOptional() @Trim() @IsString() @MinLength(3) @MaxLength(255)
  title?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  serviceId?: number;

  @IsOptional() @Trim() @IsString() @MinLength(5) @MaxLength(500)
  shortDescription?: string;

  @IsOptional() @Trim() @IsUrl(URL_OPTS, { message: 'url must be a valid http(s) link' }) @MaxLength(500)
  url?: string;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}
