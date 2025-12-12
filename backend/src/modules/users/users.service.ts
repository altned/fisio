import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../domain/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
    constructor(private readonly dataSource: DataSource) { }

    async getProfile(userId: string): Promise<User> {
        const user = await this.dataSource.getRepository(User).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
        const userRepo = this.dataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (dto.fullName) {
            user.fullName = dto.fullName;
            user.isProfileComplete = true; // Mark profile as complete logic
        }

        if (dto.password) {
            user.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        }

        return userRepo.save(user);
    }
}
