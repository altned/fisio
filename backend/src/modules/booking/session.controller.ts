import { Controller, Param, Post } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.sessionService.completeSession(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.sessionService.cancelSession(id);
  }

  @Post('expire/run')
  expire() {
    return this.sessionService.expirePendingSessions();
  }
}
