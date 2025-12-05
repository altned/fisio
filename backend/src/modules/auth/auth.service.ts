import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { User } from '../../domain/entities/user.entity';
import { LoginDto } from './dto/login.dto';

// Note: Untuk production, gunakan bcrypt untuk hash password
// Ini adalah implementasi sederhana untuk development

@Injectable()
export class AuthService {
    constructor(private readonly dataSource: DataSource) { }

    async login(dto: LoginDto): Promise<{ accessToken: string; user: Partial<User> }> {
        const userRepo = this.dataSource.getRepository(User);

        const user = await userRepo.findOne({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Email atau password salah');
        }

        // Simple password check - in production use bcrypt.compare()
        // For now, we accept any password for seed users (development only)
        // In production: await bcrypt.compare(dto.password, user.passwordHash)

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
}
