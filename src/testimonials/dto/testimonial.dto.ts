import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ToBoolean, Trim } from '../../common/decorators/transforms.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';

export class CreateTestimonialDto {
  @Trim() @IsString() @MinLength(2) @MaxLength(160)
  name: string;

  @Trim() @IsString() @MinLength(10) @MaxLength(3000)
  review: string;

  @Type(() => Number) @IsInt() @Min(1) @Max(5)
  rating: number;

  // Used for backend mapping only; not shown on the testimonial card.
  @Type(() => Number) @IsInt()
  serviceId: number;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateTestimonialDto {
  @IsOptional() @Trim() @IsString() @MinLength(2) @MaxLength(160)
  name?: string;

  @IsOptional() @Trim() @IsString() @MinLength(10) @MaxLength(3000)
  review?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)
  rating?: number;

  @IsOptional() @Type(() => Number) @IsInt()
  serviceId?: number;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}

// Admin list filters (service by id) on top of paging.
export class AdminListQueryDto extends PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt()
  serviceId?: number;

  @IsOptional() @ToBoolean() @IsBoolean()
  isEnabled?: boolean;
}
