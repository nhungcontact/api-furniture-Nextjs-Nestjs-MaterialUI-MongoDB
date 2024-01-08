import {
	IsArray,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator';

export class CartPaymentRequestDto {
	@IsOptional()
	@IsString()
	@MinLength(0)
	@MaxLength(200)
	description?: string;

	@IsArray()
	cartItemIDs: string[];
}
