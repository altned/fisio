import { Controller, Get, Param } from '@nestjs/common';
import { TherapistService } from './therapist.service';

@Controller('therapists')
export class TherapistController {
  constructor(private readonly therapistService: TherapistService) {}

  @Get()
  list() {
    return this.therapistService.list();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.therapistService.detail(id);
  }
}
