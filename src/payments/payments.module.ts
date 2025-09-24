import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import Stripe from 'stripe';
import { stripeConfig } from '../config/stripe.config.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';

@Module({
  imports: [ConfigModule.forFeature(stripeConfig)],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'STRIPE',
      inject: [stripeConfig.KEY],
      useFactory: (config: ConfigType<typeof stripeConfig>) => {
        return new Stripe(config.secretKey);
      },
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
