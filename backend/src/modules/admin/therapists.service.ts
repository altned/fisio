import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Therapist } from '../../domain/entities/therapist.entity';
import { User } from '../../domain/entities/user.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { CreateTherapistDto } from './dto/create-therapist.dto';
import { UpdateTherapistDto } from './dto/update-therapist.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class TherapistsService {
    constructor(private readonly dataSource: DataSource) { }

    async findAll(): Promise<Therapist[]> {
        return this.dataSource.getRepository(Therapist).find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Therapist> {
        const therapist = await this.dataSource.getRepository(Therapist).findOne({
            where: { id },
            relations: ['user'],
        });
        if (!therapist) {
            throw new NotFoundException('Therapist tidak ditemukan');
        }
        return therapist;
    }

    async create(dto: CreateTherapistDto): Promise<Therapist> {
        const userRepo = this.dataSource.getRepository(User);
        const therapistRepo = this.dataSource.getRepository(Therapist);
        const walletRepo = this.dataSource.getRepository(Wallet);

        // Check if email already exists
        const existingUser = await userRepo.findOne({ where: { email: dto.email } });
        if (existingUser) {
            throw new BadRequestException('Email sudah terdaftar');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        // Create in transaction
        return this.dataSource.transaction(async (manager) => {
            // Create user
            const user = manager.create(User, {
                email: dto.email,
                fullName: dto.fullName,
                passwordHash,
                role: 'THERAPIST',
                isProfileComplete: true,
            });
            await manager.save(user);

            // Create therapist
            const therapist = manager.create(Therapist, {
                user,
                bidang: dto.bidang || null,
                phone: dto.phone || null,
                address: dto.address || null,
                city: dto.city || null,
                strNumber: dto.strNumber || null,
                experienceYears: dto.experienceYears || 0,
                bio: dto.bio || null,
                isActive: true,
            });
            await manager.save(therapist);

            // Create wallet
            const wallet = manager.create(Wallet, {
                therapist,
                balance: '0',
            });
            await manager.save(wallet);

            return therapist;
        });
    }

    async update(id: string, dto: UpdateTherapistDto): Promise<Therapist> {
        const therapist = await this.findOne(id);
        const repo = this.dataSource.getRepository(Therapist);

        if (dto.bidang !== undefined) therapist.bidang = dto.bidang;
        if (dto.phone !== undefined) therapist.phone = dto.phone;
        if (dto.address !== undefined) therapist.address = dto.address;
        if (dto.city !== undefined) therapist.city = dto.city;
        if (dto.photoUrl !== undefined) therapist.photoUrl = dto.photoUrl;
        if (dto.strNumber !== undefined) therapist.strNumber = dto.strNumber;
        if (dto.experienceYears !== undefined) therapist.experienceYears = dto.experienceYears;
        if (dto.bio !== undefined) therapist.bio = dto.bio;
        if (dto.isActive !== undefined) therapist.isActive = dto.isActive;

        return repo.save(therapist);
    }

    async toggleStatus(id: string): Promise<Therapist> {
        const therapist = await this.findOne(id);
        therapist.isActive = !therapist.isActive;
        return this.dataSource.getRepository(Therapist).save(therapist);
    }

    async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
        const therapist = await this.findOne(id);
        const userRepo = this.dataSource.getRepository(User);

        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        therapist.user.passwordHash = passwordHash;
        await userRepo.save(therapist.user);

        return { message: 'Password berhasil direset' };
    }
}

