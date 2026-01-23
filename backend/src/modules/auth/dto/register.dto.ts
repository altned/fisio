import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
    @IsEmail({}, { message: 'Email tidak valid' })
    @IsNotEmpty({ message: 'Email wajib diisi' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'Password wajib diisi' })
    @MinLength(6, { message: 'Password minimal 6 karakter' })
    password!: string;

    @IsString()
    @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
    @MinLength(2, { message: 'Nama minimal 2 karakter' })
    fullName!: string;

    @IsOptional()
    @IsIn(['PATIENT', 'THERAPIST', 'ADMIN'], { message: 'Role tidak valid' })
    role?: 'PATIENT' | 'THERAPIST' | 'ADMIN';
}
