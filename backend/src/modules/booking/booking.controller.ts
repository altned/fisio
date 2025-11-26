import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RespondBookingDto } from './dto/respond-booking.dto';
import { Roles, RolesGuard } from '../../common/auth';
import { SearchBookingDto } from './dto/search-booking.dto';
import { TimeoutService } from './timeout.service';
import { ChatLockService } from './chat-lock.service';
import { SessionService } from './session.service';

@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly timeoutService: TimeoutService,
    private readonly chatLockService: ChatLockService,
    private readonly sessionService: SessionService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  search(@Query() query: any) {
    const parsed: SearchBookingDto = {
      therapistId: query.therapistId,
      userId: query.userId,
      status: query.status,
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
  create(@Body() body: CreateBookingDto): Promise<Booking> {
    return this.bookingService.createBooking({
      ...body,
      scheduledAt: new Date(body.scheduledAt),
    });
  }

  @Post('accept')
  accept(@Body() body: RespondBookingDto) {
    return this.bookingService.acceptBooking(body);
  }

  @Post('decline')
  decline(@Body() body: RespondBookingDto) {
    return this.bookingService.declineBooking(body);
  }

  @Post('timeout/run')
  runTimeouts() {
    return this.timeoutService.handleTherapistTimeouts();
  }

  @Post('expire/run')
  expirePendingSessions() {
    return this.sessionService.expirePendingSessions();
  }

  @Post('chat-lock/run')
  runChatLock() {
    return this.chatLockService.lockChats();
  }
}
