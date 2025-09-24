import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  getStatus() {
    return { service: 'payments', status: 'ready' };
  }
}
