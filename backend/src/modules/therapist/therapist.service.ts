import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Therapist } from '../../domain/entities/therapist.entity';

@Injectable()
export class TherapistService {
  constructor(private readonly dataSource: DataSource) { }

  async list(): Promise<Therapist[]> {
    return this.dataSource.getRepository(Therapist).find({
      relations: ['user'],
      where: { isActive: true },
      select: {
        id: true,
        bidang: true,
        address: true,
        city: true,
        experienceYears: true,
        averageRating: true,
        totalReviews: true,
        photoUrl: true,
        bio: true,
        user: {
          id: true,
          fullName: true,
        },
      },
      order: { averageRating: 'DESC' as const },
    });
  }

  async detail(id: string): Promise<Therapist> {
    const therapist = await this.dataSource.getRepository(Therapist).findOne({
      where: { id },
      relations: ['user'],
      select: {
        id: true,
        bidang: true,
        address: true,
        city: true,
        experienceYears: true,
        averageRating: true,
        totalReviews: true,
        photoUrl: true,
        bio: true,
        phone: true,
        strNumber: true,
        user: {
          id: true,
          fullName: true,
        },
      },
    });
    if (!therapist) throw new BadRequestException('Terapis tidak ditemukan');
    return therapist;
  }
}
