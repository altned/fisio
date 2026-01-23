import { IsString, IsNotEmpty, IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitize } from '../../../common/utils/sanitize';

export class SubmitReviewDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId!: string;

  @IsUUID()
  @IsNotEmpty()
  therapistId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ? sanitize(value.trim()) : undefined)
  comment?: string;
}
