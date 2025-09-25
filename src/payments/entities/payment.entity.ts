import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'stripe_payment_id' })
  stripePaymentId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column('int')
  amount!: number;

  @Column()
  currency!: string;

  @Column()
  status!: 'pending' | 'succeeded' | 'failed' | 'refunded';

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
