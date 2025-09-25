import { Injectable, Inject, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(@Inject('STRIPE') private readonly stripe: Stripe) {}

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

  async createPaymentIntent(
    createPaymentDto: CreatePaymentDto,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log('Creating payment intent', {
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

      this.logger.log('Payment intent created successfully', {
        paymentIntentId: paymentIntent.id,
      });
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error creating payment intent', error);
      throw error;
    }
  }

  async confirmPaymentIntent(
    confirmPaymentDto: ConfirmPaymentDto,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log('Confirming payment intent', {
        paymentIntentId: confirmPaymentDto.paymentIntentId,
      });

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        confirmPaymentDto.paymentIntentId,
        {
          payment_method: confirmPaymentDto.paymentMethodId,
        },
      );

      this.logger.log('Payment intent confirmed successfully', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      });
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error confirming payment intent', error);
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
}
