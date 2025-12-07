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
}
