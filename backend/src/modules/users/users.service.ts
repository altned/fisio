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
        }

        if (dto.password) {
            user.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        }

        // Handle FCM token update (can be null to unregister)
        if (dto.fcmToken !== undefined) {
            user.fcmToken = dto.fcmToken;
        }

        // Handle phone number update
        if (dto.phoneNumber !== undefined) {
            user.phoneNumber = dto.phoneNumber;
        }

        // Handle address update
        if (dto.address !== undefined) {
            user.address = dto.address;
        }

        // Handle profile photo URL update
        if (dto.profilePhotoUrl !== undefined) {
            user.profilePhotoUrl = dto.profilePhotoUrl;
        }

        // Handle coordinates update
        if (dto.latitude !== undefined) {
            user.latitude = dto.latitude;
        }
        if (dto.longitude !== undefined) {
            user.longitude = dto.longitude;
        }

        // Handle extended patient profile fields
        if (dto.birthDate !== undefined) {
            user.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
        }
        if (dto.gender !== undefined) {
            user.gender = dto.gender;
        }
        if (dto.bloodType !== undefined) {
            user.bloodType = dto.bloodType;
        }
        if (dto.allergies !== undefined) {
            user.allergies = dto.allergies;
        }
        if (dto.medicalHistory !== undefined) {
            user.medicalHistory = dto.medicalHistory;
        }
        if (dto.emergencyContactName !== undefined) {
            user.emergencyContactName = dto.emergencyContactName;
        }
        if (dto.emergencyContactPhone !== undefined) {
            user.emergencyContactPhone = dto.emergencyContactPhone;
        }
        if (dto.height !== undefined) {
            user.height = dto.height;
        }
        if (dto.weight !== undefined) {
            user.weight = dto.weight;
        }

        // Check if profile is complete (has fullName & phoneNumber)
        if (user.fullName && user.phoneNumber) {
            user.isProfileComplete = true;
        }

        return userRepo.save(user);
    }
}
