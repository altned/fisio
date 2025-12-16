import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Package } from '../../domain/entities/package.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
    constructor(private readonly dataSource: DataSource) { }

    async findAll(): Promise<Package[]> {
        return this.dataSource.getRepository(Package).find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Package> {
        const pkg = await this.dataSource.getRepository(Package).findOne({
            where: { id },
        });
        if (!pkg) {
            throw new NotFoundException('Package tidak ditemukan');
        }
        return pkg;
    }

    async create(dto: CreatePackageDto): Promise<Package> {
        this.validateInput(dto);

        const repo = this.dataSource.getRepository(Package);

        // Check for duplicate name
        const existing = await repo.findOne({ where: { name: dto.name } });
        if (existing) {
            throw new BadRequestException('Nama package sudah digunakan');
        }

        const pkg = repo.create({
            name: dto.name,
            sessionCount: dto.sessionCount,
            totalPrice: dto.totalPrice,
            commissionRate: dto.commissionRate || '30', // Default 30%
            promoImageUrl: dto.promoImageUrl || null,
            showOnDashboard: dto.showOnDashboard || false,
        });
        return repo.save(pkg);
    }

    async update(id: string, dto: UpdatePackageDto): Promise<Package> {
        const repo = this.dataSource.getRepository(Package);
        const pkg = await this.findOne(id);

        if (dto.name && dto.name !== pkg.name) {
            const existing = await repo.findOne({ where: { name: dto.name } });
            if (existing) {
                throw new BadRequestException('Nama package sudah digunakan');
            }
            pkg.name = dto.name;
        }

        if (dto.sessionCount !== undefined) {
            if (dto.sessionCount < 1) {
                throw new BadRequestException('Jumlah sesi minimal 1');
            }
            pkg.sessionCount = dto.sessionCount;
        }

        if (dto.totalPrice !== undefined) {
            const price = Number(dto.totalPrice);
            if (isNaN(price) || price <= 0) {
                throw new BadRequestException('Harga harus lebih dari 0');
            }
            pkg.totalPrice = dto.totalPrice;
        }

        if (dto.commissionRate !== undefined) {
            const rate = Number(dto.commissionRate);
            if (isNaN(rate) || rate < 0 || rate > 100) {
                throw new BadRequestException('Commission rate harus antara 0-100');
            }
            pkg.commissionRate = dto.commissionRate;
        }

        if (dto.promoImageUrl !== undefined) {
            pkg.promoImageUrl = dto.promoImageUrl || null;
        }

        if (dto.showOnDashboard !== undefined) {
            pkg.showOnDashboard = dto.showOnDashboard;
        }

        return repo.save(pkg);
    }

    async remove(id: string): Promise<{ success: boolean }> {
        const pkg = await this.findOne(id);
        await this.dataSource.getRepository(Package).remove(pkg);
        return { success: true };
    }

    private validateInput(dto: CreatePackageDto): void {
        if (!dto.name || dto.name.trim().length === 0) {
            throw new BadRequestException('Nama package wajib diisi');
        }
        if (!dto.sessionCount || dto.sessionCount < 1) {
            throw new BadRequestException('Jumlah sesi minimal 1');
        }
        const price = Number(dto.totalPrice);
        if (isNaN(price) || price <= 0) {
            throw new BadRequestException('Harga harus lebih dari 0');
        }
        if (dto.commissionRate !== undefined) {
            const rate = Number(dto.commissionRate);
            if (isNaN(rate) || rate < 0 || rate > 100) {
                throw new BadRequestException('Commission rate harus antara 0-100');
            }
        }
    }
}
