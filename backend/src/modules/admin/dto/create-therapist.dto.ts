export class CreateTherapistDto {
    // User fields
    email!: string;
    fullName!: string;
    password!: string;

    // Therapist profile fields
    bidang?: string;
    phone?: string;
    address?: string;
    strNumber?: string;
    experienceYears?: number;
    bio?: string;
}
