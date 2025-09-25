import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 5000, description: 'Monto en centavos' })
  @IsNumber()
  @Min(50) // Mínimo 50 centavos
  amount!: number;

  @ApiProperty({ example: 'usd' })
  @IsString()
  currency!: string;

  @ApiProperty({ example: 'pm_card_visa', required: false })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({ example: 'cus_123', required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ example: 'Pago por servicios', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
