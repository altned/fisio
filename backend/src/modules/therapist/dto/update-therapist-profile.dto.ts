import { IsOptional, IsString, IsDateString, IsIn, IsInt, Min, Max, IsNumber } from 'class-validator';

export class UpdateTherapistProfileDto {
    // Basic profile fields
    @IsOptional()
    @IsString()
    bidang?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    photoUrl?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    // STR credentials
    @IsOptional()
    @IsString()
    strNumber?: string;

    @IsOptional()
    @IsDateString()
    strExpiryDate?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(50)
    experienceYears?: number;

    // Extended profile fields
    @IsOptional()
    @IsDateString()
    birthDate?: string;

    @IsOptional()
    @IsString()
    @IsIn(['MALE', 'FEMALE'])
    gender?: 'MALE' | 'FEMALE';

    @IsOptional()
    @IsString()
    education?: string; // e.g. "S1 Fisioterapi UI"

    @IsOptional()
    @IsString()
    certifications?: string; // Comma-separated or JSON
}
