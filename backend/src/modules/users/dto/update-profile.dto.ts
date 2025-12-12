import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    fullName?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;
}
