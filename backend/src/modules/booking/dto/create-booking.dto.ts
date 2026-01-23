import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  IsDateString,
  IsDecimal,
} from 'class-validator';
import { Transform } from 'class-transformer';

export type BookingType = 'REGULAR' | 'INSTANT';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsUUID()
  @IsNotEmpty()
  therapistId!: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  lockedAddress!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  scheduledAt!: Date;

  @IsIn(['REGULAR', 'INSTANT'])
  bookingType!: BookingType;

  @IsString()
  @IsNotEmpty()
  totalPrice!: string;

  @IsString()
  @IsNotEmpty()
  adminFeeAmount!: string;

  @IsString()
  @IsNotEmpty()
  therapistNetTotal!: string;

  // Consent fields - all required and must be true
  @IsBoolean()
  consentService!: boolean;

  @IsBoolean()
  consentDataSharing!: boolean;

  @IsBoolean()
  consentTerms!: boolean;

  @IsBoolean()
  consentMedicalDisclaimer!: boolean;
}
