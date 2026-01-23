import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Email tidak valid' })
    @IsNotEmpty({ message: 'Email wajib diisi' })
    email!: string;
}
