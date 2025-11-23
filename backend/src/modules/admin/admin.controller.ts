import { Body, Controller, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CompleteRefundDto } from './dto/complete-refund.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('bookings/refund')
  completeRefund(@Body() body: CompleteRefundDto) {
    return this.adminService.completeRefund(body);
  }
}
