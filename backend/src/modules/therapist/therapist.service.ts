import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Therapist } from '../../domain/entities/therapist.entity';

@Injectable()
export class TherapistService {
  constructor(private readonly dataSource: DataSource) {}

  async list(): Promise<Therapist[]> {
    return this.dataSource.getRepository(Therapist).find({
      relations: ['user'],
      order: { averageRating: 'DESC' as const },
    });
  }

  async detail(id: string): Promise<Therapist> {
    const therapist = await this.dataSource.getRepository(Therapist).findOne({
      where: { id },
      relations: ['user'],
    });
    if (!therapist) throw new BadRequestException('Terapis tidak ditemukan');
    return therapist;
  }
}
