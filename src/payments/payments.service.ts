import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto.js';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';
import { ConfirmPaymentIntentDto } from './dto/confirm-payment-intent.dto.js';
import { Payment } from './entities/payment.entity.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject('STRIPE') private readonly stripe: Stripe,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getStatus() {
    return { service: 'payments', status: 'ready' };
  }

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
  ): Promise<Stripe.Customer> {
    try {
      this.logger.log('Creating customer', { email: createCustomerDto.email });

      const customer = await this.stripe.customers.create({
        name: createCustomerDto.name,
        email: createCustomerDto.email,
        phone: createCustomerDto.phone,
        address: createCustomerDto.address
          ? {
              line1: createCustomerDto.address,
            }
          : undefined,
      });

      this.logger.log('Customer created successfully', {
        customerId: customer.id,
      });
      return customer;
    } catch (error) {
      this.logger.error('Error creating customer', error);
      throw error;
    }
  }

  async createPaymentIntentLegacy(
    createPaymentDto: CreatePaymentDto,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log('Creating payment intent (legacy)', {
        amount: createPaymentDto.amount,
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        customer: createPaymentDto.customerId,
        payment_method: createPaymentDto.paymentMethodId,
        description: createPaymentDto.description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log('Payment intent created successfully (legacy)', {
        paymentIntentId: paymentIntent.id,
      });
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error creating payment intent (legacy)', error);
      throw error;
    }
  }

  async confirmPaymentIntentLegacy(
    confirmPaymentDto: ConfirmPaymentDto,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log('Confirming payment intent (legacy)', {
        paymentIntentId: confirmPaymentDto.paymentIntentId,
      });

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        confirmPaymentDto.paymentIntentId,
        {
          payment_method: confirmPaymentDto.paymentMethodId,
        },
      );

      this.logger.log('Payment intent confirmed successfully (legacy)', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      });
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error confirming payment intent (legacy)', error);
      throw error;
    }
  }

  async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log('Retrieving payment intent', { paymentIntentId });

      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      this.logger.log('Payment intent retrieved successfully', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      });
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error retrieving payment intent', error);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      this.logger.log('Retrieving customer', { customerId });

      const customer = (await this.stripe.customers.retrieve(
        customerId,
      )) as Stripe.Customer;

      this.logger.log('Customer retrieved successfully', {
        customerId: customer.id,
      });
      return customer;
    } catch (error) {
      this.logger.error('Error retrieving customer', error);
      throw error;
    }
  }

  // ===== MVP METHODS =====

  async createPaymentIntent(
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<{ paymentId: string; clientSecret: string }> {
    try {
      this.logger.log('Creating payment intent for MVP', {
        userId: createPaymentIntentDto.userId,
        amount: createPaymentIntentDto.amount,
      });

      // Crear PaymentIntent en Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: createPaymentIntentDto.amount,
        currency: createPaymentIntentDto.currency,
        description: createPaymentIntentDto.description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Guardar en Supabase
      const payment = this.paymentRepository.create({
        stripePaymentId: paymentIntent.id,
        userId: createPaymentIntentDto.userId,
        amount: createPaymentIntentDto.amount,
        currency: createPaymentIntentDto.currency,
        status: 'pending',
        description: createPaymentIntentDto.description,
      });

      const savedPayment = await this.paymentRepository.save(payment);

      this.logger.log('Payment intent created successfully', {
        paymentId: savedPayment.id,
        stripePaymentIntentId: paymentIntent.id,
      });

      return {
        paymentId: savedPayment.id,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      this.logger.error('Error creating payment intent', error);
      throw this.handleStripeError(error);
    }
  }

  async confirmPaymentIntent(
    confirmPaymentIntentDto: ConfirmPaymentIntentDto,
  ): Promise<{ status: string }> {
    try {
      this.logger.log('Confirming payment intent', {
        paymentId: confirmPaymentIntentDto.paymentId,
      });

      // Buscar el pago en nuestra BD
      const payment = await this.paymentRepository.findOne({
        where: { id: confirmPaymentIntentDto.paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Confirmar en Stripe
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        payment.stripePaymentId,
      );

      // Actualizar estado en BD
      const newStatus =
        paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed';
      await this.paymentRepository.update(payment.id, { status: newStatus });

      this.logger.log('Payment intent confirmed successfully', {
        paymentId: payment.id,
        status: newStatus,
      });

      return { status: newStatus };
    } catch (error) {
      this.logger.error('Error confirming payment intent', error);
      throw this.handleStripeError(error);
    }
  }

  async getPayment(paymentId: string): Promise<Payment> {
    try {
      this.logger.log('Retrieving payment', { paymentId });

      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      this.logger.log('Payment retrieved successfully', {
        paymentId: payment.id,
        status: payment.status,
      });

      return payment;
    } catch (error) {
      this.logger.error('Error retrieving payment', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    try {
      this.logger.log('Processing webhook', {
        signature: signature ? 'present' : 'missing',
        payloadType: typeof payload,
      });

      // Usar Buffer o string exacto; no serializar objetos porque rompe la firma
      let payloadForSignature: string | Buffer;
      if (Buffer.isBuffer(payload)) {
        payloadForSignature = payload;
      } else if (typeof payload === 'string') {
        payloadForSignature = payload;
      } else {
        throw new Error(
          'Invalid webhook payload type; expected Buffer or string',
        );
      }

      // Verificar firma del webhook
      const event = this.stripe.webhooks.constructEvent(
        payloadForSignature as any,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );

      this.logger.log('Webhook event received', {
        type: event.type,
        id: event.id,
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as any);
          break;
        default:
          this.logger.log('Unhandled event type', { type: event.type });
      }

      this.logger.log('Webhook processed successfully', { type: event.type });
    } catch (error) {
      this.logger.error('Error processing webhook', {
        error: error.message,
        stack: error.stack,
        signature: signature ? 'present' : 'missing',
      });
      throw error;
    }
  }

  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    await this.updatePaymentStatus(paymentIntent.id, 'succeeded');
  }

  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    await this.updatePaymentStatus(paymentIntent.id, 'failed');
  }

  private async handleChargeRefunded(chargeOrRefund: any): Promise<void> {
    // Puede venir como Charge o Refund; obtener payment_intent
    const paymentIntentId: string | undefined =
      typeof chargeOrRefund.payment_intent === 'string'
        ? chargeOrRefund.payment_intent
        : chargeOrRefund.payment_intent?.id;

    if (paymentIntentId) {
      await this.updatePaymentStatus(paymentIntentId, 'refunded');
      return;
    }

    // Si solo viene el id del charge, intentar recuperar el charge para obtener el payment_intent
    if (
      chargeOrRefund.id &&
      chargeOrRefund.object === 'refund' &&
      chargeOrRefund.charge
    ) {
      try {
        const charge = await this.stripe.charges.retrieve(
          chargeOrRefund.charge,
        );
        const pi =
          (charge.payment_intent as any)?.id ||
          (charge.payment_intent as string);
        if (pi) {
          await this.updatePaymentStatus(pi, 'refunded');
        }
      } catch (e) {
        this.logger.warn('Could not resolve payment_intent for refund', {
          refundId: chargeOrRefund.id,
          chargeId: chargeOrRefund.charge,
          error: (e as any).message,
        });
      }
    }
  }

  private async updatePaymentStatus(
    stripePaymentId: string,
    status: 'succeeded' | 'failed' | 'refunded',
  ): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentId },
    });

    if (payment) {
      await this.paymentRepository.update(payment.id, { status });
      this.logger.log('Payment status updated', {
        paymentId: payment.id,
        stripePaymentId,
        status,
      });
    }
  }

  async testWebhookConfig() {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    return {
      webhookSecret: webhookSecret ? 'Configurado' : 'No configurado',
      stripeKey: stripeKey ? 'Configurado' : 'No configurado',
      webhookSecretLength: webhookSecret?.length || 0,
      endpoint: '/api/v1/payments/webhook',
      supportedEvents: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'charge.refunded',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  private handleStripeError(error: any): Error {
    if (error.type) {
      switch (error.type) {
        case 'card_declined':
          return new Error(
            'Tu tarjeta fue rechazada. Por favor, intenta con otra tarjeta.',
          );
        case 'insufficient_funds':
          return new Error(
            'Fondos insuficientes. Por favor, intenta con otro método de pago.',
          );
        case 'expired_card':
          return new Error(
            'Tu tarjeta ha expirado. Por favor, usa una tarjeta diferente.',
          );
        case 'processing_error':
          return new Error(
            'Error de procesamiento. Por favor, intenta nuevamente.',
          );
        default:
          return new Error('Error de pago. Por favor, intenta nuevamente.');
      }
    }
    return error;
  }
}
