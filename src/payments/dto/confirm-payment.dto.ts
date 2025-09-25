import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'ID de PaymentIntent' })
  @IsString()
  paymentIntentId!: string;

  @ApiProperty({ example: 'pm_card_visa', required: false })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
