export class RegisterDto {
    email: string;
    password: string;
    fullName: string;
    role?: 'PATIENT' | 'THERAPIST' | 'ADMIN';
}
