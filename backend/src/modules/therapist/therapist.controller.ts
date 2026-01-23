import { Controller, Get, Param, Query, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { TherapistService } from './therapist.service';
import { UpdateTherapistProfileDto } from './dto/update-therapist-profile.dto';
import { JwtGuard } from '../../common/auth/jwt.guard';

@Controller('therapists')
export class TherapistController {
  constructor(private readonly therapistService: TherapistService) { }

  @Get()
  list() {
    return this.therapistService.list();
  }

  @Get('nearby')
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.therapistService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 50, // default 50km radius
    );
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  getMyProfile(@Request() req: any) {
    return this.therapistService.getMyProfile(req.user.id);
  }

  @UseGuards(JwtGuard)
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateTherapistProfileDto) {
    return this.therapistService.updateProfile(req.user.id, dto);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.therapistService.detail(id);
  }
}
