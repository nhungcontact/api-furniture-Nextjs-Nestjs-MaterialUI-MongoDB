import {
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator';

export class SubscriptionPaymentRequestDto {
	@IsOptional()
	@IsString()
	@MinLength(0)
	@MaxLength(200)
	description?: string;

	@IsString()
	@IsNotEmpty()
	subscriptionID: string;
}
