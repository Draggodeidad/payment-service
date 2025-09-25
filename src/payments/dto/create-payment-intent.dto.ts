import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 5000, description: 'Monto en centavos' })
  @IsNumber()
  @Min(50) // Mínimo 50 centavos
  amount!: number;

  @ApiProperty({ example: 'usd' })
  @IsString()
  currency!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del usuario (viene del API Gateway)',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'Pago por servicios', required: false })
  @IsString()
  description?: string;
}
