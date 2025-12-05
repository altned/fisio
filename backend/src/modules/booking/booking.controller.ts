import { Body, Controller, Get, Post, Query, UseGuards, Param } from '@nestjs/common';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RespondBookingDto } from './dto/respond-booking.dto';
import { Roles, RolesGuard, JwtGuard } from '../../common/auth';
import { SearchBookingDto } from './dto/search-booking.dto';
import { TimeoutService } from './timeout.service';
import { ChatLockService } from './chat-lock.service';
import { SessionService } from './session.service';
import { Throttle } from '@nestjs/throttler';

@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly timeoutService: TimeoutService,
    private readonly chatLockService: ChatLockService,
    private readonly sessionService: SessionService,
  ) {}

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  search(@Query() query: any) {
    const parsed: SearchBookingDto = {
      therapistId: query.therapistId,
      userId: query.userId,
      status: query.status,
      paymentStatus: query.paymentStatus,
      from: query.from ? new Date(query.from) : null,
      to: query.to ? new Date(query.to) : null,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    };
    if (parsed.from && Number.isNaN(parsed.from.getTime())) parsed.from = null;
    if (parsed.to && Number.isNaN(parsed.to.getTime())) parsed.to = null;
    return this.bookingService.search(parsed);
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('PATIENT')
  @Throttle(5, 60)
  create(@Body() body: CreateBookingDto): Promise<Booking> {
    return this.bookingService.createBooking({
      ...body,
      scheduledAt: new Date(body.scheduledAt),
    });
  }

  @Post('accept')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('THERAPIST')
  @Throttle(10, 60)
  accept(@Body() body: RespondBookingDto) {
    return this.bookingService.acceptBooking(body);
  }

  @Post('decline')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('THERAPIST')
  @Throttle(10, 60)
  decline(@Body() body: RespondBookingDto) {
    return this.bookingService.declineBooking(body);
  }

  @Post('timeout/run')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  runTimeouts() {
    return this.timeoutService.handleTherapistTimeouts();
  }

  @Post('expire/run')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  expirePendingSessions() {
    return this.sessionService.expirePendingSessions();
  }

  @Post('chat-lock/run')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  runChatLock() {
    return this.chatLockService.lockChats();
  }

  @Get(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  detail(@Param('id') id: string) {
    return this.bookingService.getDetail(id);
  }
}
