import { IsOptional, IsString, MinLength, IsNumber, IsDateString, IsIn, IsInt, Min, Max } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    fullName?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @IsOptional()
    @IsString()
    fcmToken?: string | null;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    profilePhotoUrl?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    // Extended patient profile fields
    @IsOptional()
    @IsDateString()
    birthDate?: string;

    @IsOptional()
    @IsString()
    @IsIn(['MALE', 'FEMALE'])
    gender?: 'MALE' | 'FEMALE';

    @IsOptional()
    @IsIn(['A', 'B', 'AB', 'O', null])
    bloodType?: 'A' | 'B' | 'AB' | 'O' | null;

    @IsOptional()
    @IsString()
    allergies?: string;

    @IsOptional()
    @IsString()
    medicalHistory?: string;

    @IsOptional()
    @IsString()
    emergencyContactName?: string;

    @IsOptional()
    @IsString()
    emergencyContactPhone?: string;

    @IsOptional()
    @IsInt()
    @Min(50)
    @Max(250)
    height?: number; // in cm

    @IsOptional()
    @IsInt()
    @Min(20)
    @Max(300)
    weight?: number; // in kg
}
