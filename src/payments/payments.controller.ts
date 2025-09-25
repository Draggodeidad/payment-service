import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Headers,
  Logger,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto.js';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';
import { ConfirmPaymentIntentDto } from './dto/confirm-payment-intent.dto.js';

@ApiTags('payments')
@Controller('payments')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Obtener estado del servicio de pagos' })
  @ApiResponse({ status: 200, description: 'Estado del servicio' })
  status() {
    return this.paymentsService.getStatus();
  }

  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.paymentsService.createCustomer(createCustomerDto);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiParam({ name: 'id', description: 'ID del cliente en Stripe' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async getCustomer(@Param('id') customerId: string) {
    return this.paymentsService.getCustomer(customerId);
  }

  @Post('payment-intents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo PaymentIntent (Legacy)' })
  @ApiResponse({
    status: 201,
    description: 'PaymentIntent creado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createPaymentIntentLegacy(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPaymentIntentLegacy(createPaymentDto);
  }

  @Post('payment-intents/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar un PaymentIntent (Legacy)' })
  @ApiResponse({
    status: 200,
    description: 'PaymentIntent confirmado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async confirmPaymentIntentLegacy(
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ) {
    return this.paymentsService.confirmPaymentIntentLegacy(confirmPaymentDto);
  }

  @Get('payment-intents/:id')
  @ApiOperation({ summary: 'Obtener PaymentIntent por ID' })
  @ApiParam({ name: 'id', description: 'ID del PaymentIntent en Stripe' })
  @ApiResponse({ status: 200, description: 'PaymentIntent encontrado' })
  @ApiResponse({ status: 404, description: 'PaymentIntent no encontrado' })
  async getPaymentIntent(@Param('id') paymentIntentId: string) {
    return this.paymentsService.getPaymentIntent(paymentIntentId);
  }

  // ===== MVP ENDPOINTS =====

  @Post('intent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear PaymentIntent para MVP' })
  @ApiResponse({
    status: 201,
    description: 'PaymentIntent creado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(createPaymentIntentDto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar PaymentIntent' })
  @ApiResponse({
    status: 200,
    description: 'PaymentIntent confirmado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async confirmPaymentIntent(
    @Body() confirmPaymentIntentDto: ConfirmPaymentIntentDto,
  ) {
    return this.paymentsService.confirmPaymentIntent(confirmPaymentIntentDto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de Stripe' })
  @ApiResponse({ status: 200, description: 'Webhook procesado exitosamente' })
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      // req.body es un Buffer por el raw body middleware
      await this.paymentsService.handleWebhook(req.body as any, signature);
      return { received: true };
    } catch (error) {
      this.logger.error('Webhook error:', error);
      throw error;
    }
  }

  @Get('webhook/test')
  @ApiOperation({ summary: 'Probar configuración de webhook' })
  @ApiResponse({ status: 200, description: 'Configuración de webhook' })
  async testWebhookConfig() {
    return this.paymentsService.testWebhookConfig();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener estado de un pago' })
  @ApiParam({ name: 'id', description: 'ID del pago en nuestra BD' })
  @ApiResponse({ status: 200, description: 'Pago encontrado' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async getPayment(@Param('id') paymentId: string) {
    return this.paymentsService.getPayment(paymentId);
  }
}
