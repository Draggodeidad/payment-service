// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
//   UpdateDateColumn,
// } from 'typeorm';

// @Entity('payments')
export class Payment {
  // @PrimaryGeneratedColumn('uuid')
  id!: string;

  // @Column()
  stripePaymentIntentId!: string;

  // @Column()
  stripeCustomerId!: string;

  // @Column('int')
  amount!: number;

  // @Column()
  currency!: string;

  // @Column()
  status!: string; // pending, succeeded, failed, canceled

  // @Column({ nullable: true })
  description?: string;

  // @Column({ nullable: true })
  paymentMethodId?: string;

  // @CreateDateColumn()
  createdAt!: Date;

  // @UpdateDateColumn()
  updatedAt!: Date;
}
