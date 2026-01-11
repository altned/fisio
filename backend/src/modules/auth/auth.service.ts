import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { sign } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { User } from '../../domain/entities/user.entity';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
    constructor(private readonly dataSource: DataSource) { }

    /**
     * Login user dengan email dan password.
     * Verifikasi bcrypt hash jika passwordHash tersedia.
     */
    async login(dto: LoginDto): Promise<{ accessToken: string; user: Partial<User> }> {
        const userRepo = this.dataSource.getRepository(User);

        const user = await userRepo.findOne({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Email atau password salah');
        }

        // Verify password jika user memiliki passwordHash
        if (user.passwordHash) {
            const isValid = await bcrypt.compare(dto.password, user.passwordHash);
            if (!isValid) {
                throw new UnauthorizedException('Email atau password salah');
            }
        } else {
            // Development mode: jika belum ada passwordHash, terima login
            // Ini hanya untuk backward compatibility dengan seed lama
            // Production: seharusnya selalu ada passwordHash
            if (process.env.NODE_ENV === 'production') {
                throw new UnauthorizedException('Account tidak valid, silakan reset password');
            }
        }

        // Generate JWT token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new UnauthorizedException('JWT secret belum dikonfigurasi');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = sign(payload, secret, { expiresIn: '7d' });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                phoneNumber: user.phoneNumber,
                address: user.address,
                profilePhotoUrl: user.profilePhotoUrl,
            },
        };
    }

    /**
     * Hash password menggunakan bcrypt.
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    /**
     * Register user baru dengan email dan password.
     */
    async register(dto: {
        email: string;
        password: string;
        fullName: string;
        role?: User['role'];
    }): Promise<{ accessToken: string; user: Partial<User> }> {
        const userRepo = this.dataSource.getRepository(User);

        // Check if email already exists
        const existing = await userRepo.findOne({ where: { email: dto.email } });
        if (existing) {
            throw new UnauthorizedException('Email sudah terdaftar');
        }

        // Hash password
        const passwordHash = await this.hashPassword(dto.password);

        // Create user
        const user = userRepo.create({
            email: dto.email,
            fullName: dto.fullName,
            passwordHash,
            role: dto.role || 'PATIENT',
            isProfileComplete: false,
        });

        await userRepo.save(user);

        // Generate token and return
        return this.login({ email: dto.email, password: dto.password });
    }

    /**
     * Login/Register dengan Google OAuth.
     * Jika user belum ada, akan dibuat dengan role PATIENT.
     */
    async loginWithGoogle(idToken: string): Promise<{ accessToken: string; user: Partial<User> }> {
        const { OAuth2Client } = await import('google-auth-library');

        // Verify Google ID token
        const client = new OAuth2Client();
        let payload;

        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (err) {
            throw new UnauthorizedException('Token Google tidak valid');
        }

        if (!payload || !payload.email) {
            throw new UnauthorizedException('Token Google tidak mengandung email');
        }

        const userRepo = this.dataSource.getRepository(User);

        // Find or create user
        let user = await userRepo.findOne({ where: { email: payload.email } });

        if (!user) {
            // Create new user with PATIENT role
            user = userRepo.create({
                email: payload.email,
                fullName: payload.name || payload.email.split('@')[0],
                passwordHash: null, // Google users don't have password
                role: 'PATIENT',
                isProfileComplete: false,
            });
            await userRepo.save(user);
        }

        // Generate JWT token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new UnauthorizedException('JWT secret belum dikonfigurasi');
        }

        const jwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = sign(jwtPayload, secret, { expiresIn: '7d' });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                phoneNumber: user.phoneNumber,
                address: user.address,
                profilePhotoUrl: user.profilePhotoUrl,
            },
        };
    }
}
