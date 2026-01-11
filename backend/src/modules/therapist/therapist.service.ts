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

  /**
   * Find nearby therapists using Haversine formula
   * @param userLat User's latitude
   * @param userLng User's longitude
   * @param radiusKm Maximum distance in kilometers
   */
  async findNearby(userLat: number, userLng: number, radiusKm: number = 50) {
    // Get all active therapists with coordinates
    const therapists = await this.dataSource.getRepository(Therapist).find({
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
        latitude: true,
        longitude: true,
        user: {
          id: true,
          fullName: true,
        },
      },
    });

    // Calculate distance for each therapist using Haversine formula
    const therapistsWithDistance = therapists
      .filter(t => t.latitude && t.longitude) // Only therapists with coordinates
      .map(therapist => {
        const distance = this.calculateHaversineDistance(
          userLat,
          userLng,
          Number(therapist.latitude),
          Number(therapist.longitude),
        );
        return {
          ...therapist,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        };
      })
      .filter(t => t.distance <= radiusKm) // Filter by radius
      .sort((a, b) => a.distance - b.distance); // Sort by distance (nearest first)

    return therapistsWithDistance;
  }

  /**
   * Get therapist profile by user ID (for authenticated therapist)
   */
  async getMyProfile(userId: string): Promise<Therapist> {
    const therapist = await this.dataSource.getRepository(Therapist).findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!therapist) throw new BadRequestException('Profil terapis tidak ditemukan');
    return therapist;
  }

  /**
   * Update therapist profile
   */
  async updateProfile(userId: string, dto: {
    bidang?: string;
    phone?: string;
    address?: string;
    city?: string;
    bio?: string;
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
    strNumber?: string;
    strExpiryDate?: string;
    experienceYears?: number;
    birthDate?: string;
    gender?: 'MALE' | 'FEMALE';
    education?: string;
    certifications?: string;
  }): Promise<Therapist> {
    const therapistRepo = this.dataSource.getRepository(Therapist);

    // Find therapist by user ID
    const therapist = await therapistRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!therapist) {
      throw new BadRequestException('Profil terapis tidak ditemukan');
    }

    // Update fields if provided
    if (dto.bidang !== undefined) therapist.bidang = dto.bidang;
    if (dto.phone !== undefined) therapist.phone = dto.phone;
    if (dto.address !== undefined) therapist.address = dto.address;
    if (dto.city !== undefined) therapist.city = dto.city;
    if (dto.bio !== undefined) therapist.bio = dto.bio;
    if (dto.photoUrl !== undefined) therapist.photoUrl = dto.photoUrl;
    if (dto.latitude !== undefined) therapist.latitude = dto.latitude;
    if (dto.longitude !== undefined) therapist.longitude = dto.longitude;
    if (dto.strNumber !== undefined) therapist.strNumber = dto.strNumber;
    if (dto.strExpiryDate !== undefined) {
      therapist.strExpiryDate = dto.strExpiryDate ? new Date(dto.strExpiryDate) : null;
    }
    if (dto.experienceYears !== undefined) therapist.experienceYears = dto.experienceYears;
    if (dto.birthDate !== undefined) {
      therapist.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    }
    if (dto.gender !== undefined) therapist.gender = dto.gender;
    if (dto.education !== undefined) therapist.education = dto.education;
    if (dto.certifications !== undefined) therapist.certifications = dto.certifications;

    return therapistRepo.save(therapist);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @returns Distance in kilometers
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}
