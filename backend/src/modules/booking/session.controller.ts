import { Body, Controller, Get, Param, Post, Query, UseGuards, Req } from '@nestjs/common';
import { SessionService } from './session.service';
import { Roles, RolesGuard, JwtGuard } from '../../common/auth';
import { Throttle } from '@nestjs/throttler';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) { }

  /**
   * Get busy slots for a therapist within date range
   * Public endpoint for booking flow (requires auth but any role)
   */
  @Get('busy-slots/:therapistId')
  @UseGuards(JwtGuard)
  getBusySlots(
    @Param('therapistId') therapistId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { busySlots: [] };
    }

    return this.sessionService.getBusySlots(therapistId, start, end);
  }

  @Post(':id/complete')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('THERAPIST')
  @Throttle(10, 60)
  complete(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Body('photoUrl') photoUrl?: string,
  ) {
    return this.sessionService.completeSession(id, notes, photoUrl);
  }

  @Post(':id/cancel')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('PATIENT', 'THERAPIST')
  @Throttle(10, 60)
  cancel(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Req() req?: any,
  ) {
    const cancelledBy = req?.user?.role === 'THERAPIST' ? 'THERAPIST' : 'PATIENT';
    return this.sessionService.cancelSession(id, reason, cancelledBy);
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

  @Post(':id/swap-therapist')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('PATIENT', 'ADMIN')
  @Throttle(10, 60)
  swapTherapist(
    @Req() req: any,
    @Param('id') id: string,
    @Body('therapistId') therapistId: string,
  ) {
    return this.sessionService.swapTherapist(id, therapistId, {
      id: req.user?.id,
      role: req.user?.role,
    });
  }
}
