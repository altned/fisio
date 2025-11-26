import { Processor, WorkerHost } from '@nestjs/bullmq';
import { WalletService } from '../../wallet/wallet.service';

@Processor('payout')
export class PayoutProcessor extends WorkerHost {
  constructor(private readonly walletService: WalletService) {
    super();
  }

  async process(job: { data: { sessionId: string } }): Promise<void> {
    const sessionId = job.data.sessionId;
    await this.walletService.payoutSession(sessionId);
  }
}
