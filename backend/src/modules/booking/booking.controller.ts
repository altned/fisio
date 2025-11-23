import { Body, Controller, Post } from '@nestjs/common';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RespondBookingDto } from './dto/respond-booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

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
}
