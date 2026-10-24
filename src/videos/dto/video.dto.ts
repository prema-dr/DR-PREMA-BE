import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Matches, MaxLength } from 'class-validator';
import { ToBoolean, Trim } from '../../common/decorators/transforms.js';

// Instagram reel / post / IGTV links only — videos are linked, not hosted.
const INSTAGRAM_URL = /^https:\/\/(www\.)?instagram\.com\/(reel|reels|p|tv)\/[\w-]+\/?(\?.*)?$/i;
const INSTAGRAM_MESSAGE = 'videoUrl must be an Instagram reel/post link (https://www.instagram.com/reel/...)';

export class CreateVideoDto {
  @Type(() => Number) @IsInt()
  serviceId: number;

  @Trim() @Matches(INSTAGRAM_URL, { message: INSTAGRAM_MESSAGE }) @MaxLength(500)
  videoUrl: string;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateVideoDto {
  @IsOptional() @Type(() => Number) @IsInt()
  serviceId?: number;

  @IsOptional() @Trim() @Matches(INSTAGRAM_URL, { message: INSTAGRAM_MESSAGE }) @MaxLength(500)
  videoUrl?: string;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}
