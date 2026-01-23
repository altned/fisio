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
    async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; user: Partial<User> }> {
        const userRepo = this.dataSource.getRepository(User);

        const user = await userRepo.findOne({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Email atau password salah');
        }

        // SECURITY: User MUST have passwordHash to login with password
        // Users without passwordHash should use Google OAuth or reset password
        if (!user.passwordHash) {
            throw new UnauthorizedException('Akun tidak memiliki password. Silakan login dengan Google atau reset password.');
        }

        // Verify password with bcrypt
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Email atau password salah');
        }

        // Generate JWT tokens
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new UnauthorizedException('JWT secret belum dikonfigurasi');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        // Access token: 30 minutes (short-lived for security)
        const accessToken = sign(payload, secret, { expiresIn: '30m' });

        // Refresh token: 7 days (long-lived, stored in DB)
        const refreshPayload = { sub: user.id, type: 'refresh' };
        const refreshToken = sign(refreshPayload, secret, { expiresIn: '7d' });

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await userRepo.save(user);

        return {
            accessToken,
            refreshToken,
            expiresIn: 1800, // 30 minutes in seconds
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
    }): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; user: Partial<User> }> {
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
    async loginWithGoogle(idToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; user: Partial<User> }> {
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

        // Generate JWT tokens
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new UnauthorizedException('JWT secret belum dikonfigurasi');
        }

        const jwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        // Access token: 30 minutes
        const accessToken = sign(jwtPayload, secret, { expiresIn: '30m' });

        // Refresh token: 7 days
        const refreshPayload = { sub: user.id, type: 'refresh' };
        const refreshToken = sign(refreshPayload, secret, { expiresIn: '7d' });

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await userRepo.save(user);

        return {
            accessToken,
            refreshToken,
            expiresIn: 1800,
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
     * Request password reset - generates 6-digit OTP
     * In production, this would send OTP via email/WhatsApp
     */
    async forgotPassword(email: string): Promise<{ message: string; otp?: string }> {
        const userRepo = this.dataSource.getRepository(User);

        const user = await userRepo.findOne({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Don't reveal if email exists for security
            return { message: 'Jika email terdaftar, kode OTP akan dikirim.' };
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // OTP expires in 15 minutes
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 15);

        // Save OTP to user
        user.resetToken = otp;
        user.resetTokenExpiry = expiry;
        await userRepo.save(user);

        // TODO: In production, send OTP via email/WhatsApp instead of returning
        // For now, return OTP in development mode
        const isDev = process.env.NODE_ENV !== 'production';

        return {
            message: 'Kode OTP telah dikirim ke email Anda. Berlaku selama 15 menit.',
            ...(isDev && { otp }), // Only return OTP in development
        };
    }

    /**
     * Reset password with OTP verification
     */
    async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
        const userRepo = this.dataSource.getRepository(User);

        const user = await userRepo.findOne({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            throw new UnauthorizedException('Email tidak ditemukan');
        }

        // Check if OTP matches
        if (!user.resetToken || user.resetToken !== otp) {
            throw new UnauthorizedException('Kode OTP tidak valid');
        }

        // Check if OTP expired
        if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
            // Clear expired token
            user.resetToken = null;
            user.resetTokenExpiry = null;
            await userRepo.save(user);
            throw new UnauthorizedException('Kode OTP sudah kadaluarsa');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password and clear reset token
        user.passwordHash = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await userRepo.save(user);

        return { message: 'Password berhasil diubah. Silakan login dengan password baru.' };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshTokenValue: string): Promise<{ accessToken: string; expiresIn: number }> {
        const userRepo = this.dataSource.getRepository(User);
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new UnauthorizedException('JWT secret belum dikonfigurasi');
        }

        try {
            // Verify refresh token
            const decoded = require('jsonwebtoken').verify(refreshTokenValue, secret) as { sub: string; type: string };

            if (decoded.type !== 'refresh') {
                throw new UnauthorizedException('Token tidak valid');
            }

            // Find user and verify stored refresh token
            const user = await userRepo.findOne({
                where: { id: decoded.sub },
            });

            if (!user || user.refreshToken !== refreshTokenValue) {
                throw new UnauthorizedException('Refresh token tidak valid atau sudah kadaluarsa');
            }

            // Generate new access token
            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role,
            };

            const accessToken = sign(payload, secret, { expiresIn: '30m' });

            return {
                accessToken,
                expiresIn: 1800,
            };
        } catch (error) {
            throw new UnauthorizedException('Refresh token tidak valid atau sudah kadaluarsa');
        }
    }

    /**
     * Logout - invalidate refresh token
     */
    async logout(userId: string): Promise<{ message: string }> {
        const userRepo = this.dataSource.getRepository(User);

        await userRepo.update({ id: userId }, { refreshToken: null });

        return { message: 'Logout berhasil' };
    }
}


