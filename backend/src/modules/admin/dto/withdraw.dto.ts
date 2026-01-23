import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitize } from '../../../common/utils/sanitize';

export class WithdrawDto {
  @IsUUID()
  @IsNotEmpty()
  walletId!: string;

  @IsString()
  @IsNotEmpty()
  amount!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitize(value?.trim() || ''))
  adminNote!: string;
}
