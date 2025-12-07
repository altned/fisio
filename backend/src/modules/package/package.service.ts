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
}
