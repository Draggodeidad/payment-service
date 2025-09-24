import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'ID de PaymentIntent' })
  paymentIntentId!: string;

  @ApiProperty({ example: 'pm_card_visa', required: false })
  paymentMethodId?: string;
}
