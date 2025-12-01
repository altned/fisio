import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import { Roles, RolesGuard, JwtGuard } from '../../common/auth';
import { Throttle } from '@nestjs/throttler';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post(':id/complete')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('THERAPIST')
  @Throttle(10, 60)
  complete(@Param('id') id: string) {
    return this.sessionService.completeSession(id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('THERAPIST')
  @Throttle(10, 60)
  cancel(@Param('id') id: string) {
    return this.sessionService.cancelSession(id);
  }

  @Post(':id/schedule')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('PATIENT', 'ADMIN')
  @Throttle(10, 60)
  schedule(@Req() req: any, @Param('id') id: string, @Body('scheduledAt') scheduledAt: string) {
    return this.sessionService.schedulePendingSession(id, new Date(scheduledAt), {
      id: req.user?.id,
      role: req.user?.role,
    });
  }

  @Post('expire/run')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  expire() {
    return this.sessionService.expirePendingSessions();
  }
}
