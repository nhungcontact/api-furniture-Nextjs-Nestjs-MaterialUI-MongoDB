import { IsNotEmpty, IsString } from 'class-validator';

export class PaymentMethodDto {
	@IsString()
	@IsNotEmpty()
	paymentMethod: string;

	@IsString()
	@IsNotEmpty()
	paymentIntentID: string;

	@IsString()
	billId: string;
}
