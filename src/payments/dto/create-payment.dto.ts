import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 5000, description: 'Monto en centavos' })
  amount!: number;

  @ApiProperty({ example: 'usd' })
  currency!: string;

  @ApiProperty({ example: 'pm_card_visa', required: false })
  paymentMethodId?: string;

  @ApiProperty({ example: 'cus_123', required: false })
  customerId?: string;
}
