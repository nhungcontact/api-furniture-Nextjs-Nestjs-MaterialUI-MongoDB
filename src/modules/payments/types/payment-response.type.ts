import { Bill } from 'src/modules/bills/schemas/bills.schema';

export class PaymentResponse {
	message?: string;
	clientSecret: string;
	paymentIntentID: string;
	bill?: Bill;
}
