import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Therapist } from '../../domain/entities/therapist.entity';
import { User } from '../../domain/entities/user.entity';
import { TherapistController } from './therapist.controller';
import { TherapistService } from './therapist.service';

@Module({
  imports: [TypeOrmModule.forFeature([Therapist, User])],
  controllers: [TherapistController],
  providers: [TherapistService],
  exports: [TherapistService],
})
export class TherapistModule {}
