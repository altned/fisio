import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Package } from '../../domain/entities/package.entity';

@Injectable()
export class PackageService {
    constructor(private readonly dataSource: DataSource) { }

    async list() {
        return this.dataSource.getRepository(Package).find({
            order: { totalPrice: 'ASC' },
        });
    }

    /**
     * Get packages marked for promo carousel on patient dashboard
     */
    async promos() {
        return this.dataSource.getRepository(Package).find({
            where: { showOnDashboard: true },
            select: {
                id: true,
                name: true,
                sessionCount: true,
                totalPrice: true,
                promoImageUrl: true,
            },
            order: { createdAt: 'DESC' },
        });
    }
}
