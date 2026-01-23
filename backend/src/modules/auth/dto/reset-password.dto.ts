import { IsEmail, IsString, IsNotEmpty, MinLength, Length } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail({}, { message: 'Email tidak valid' })
    @IsNotEmpty({ message: 'Email wajib diisi' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'Kode OTP wajib diisi' })
    @Length(6, 6, { message: 'Kode OTP harus 6 digit' })
    otp!: string;

    @IsString()
    @IsNotEmpty({ message: 'Password baru wajib diisi' })
    @MinLength(6, { message: 'Password minimal 6 karakter' })
    newPassword!: string;
}
