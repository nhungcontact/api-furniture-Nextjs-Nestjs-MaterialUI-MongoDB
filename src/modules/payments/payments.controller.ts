import { Body, Controller, Param, Post } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ErrorResponse } from 'src/shared/response/common-response';
import { CartPaymentRequestDto } from './dto/cart-payment-request-dto';

import { Public } from '../auth/decorators/public.decorator';
import { UpdateBillDto } from '../bills/dto/update-bill.dto';
import { PaymentMethodDto } from './dto/payment-method-dto';
import { PaymentsService } from './payments.service';
import { PaymentResponse } from './types/payment-response.type';

@Controller('payments')
@ApiTags('payments')
@ApiBearerAuth()
export class PaymentsController {
	constructor(private readonly paymentService: PaymentsService) {}

	@Public()
	@ApiOperation({
		summary: 'Create Cart Payment',
		// description: `Allow customers to purchase cart-item in their cart.\n\nRoles: ${UserRole.MEMBER}`,
	})
	@ApiBody({
		type: CartPaymentRequestDto,
		examples: {
			example1: {
				value: {
					description: 'string (option)',
					cartItemIDs: ['string', 'string'],
				} as CartPaymentRequestDto,
			},
		},
	})
	@ApiResponse({
		status: 201,
		schema: {
			example: {
				message: 'string',
				clientSecret: 'string',
				paymentIntentID: 'string',
			} as PaymentResponse,
		},
	})
	@ApiResponse({
		status: 400,
		schema: {
			example: {
				code: '400',
				message: 'Bad request',
				details: null,
			} as ErrorResponse<null>,
		},
	})
	@ApiResponse({
		status: 401,
		schema: {
			example: {
				code: '401',
				message: 'Unauthorized',
				details: null,
			} as ErrorResponse<null>,
		},
	})
	@ApiResponse({
		status: 402,
		schema: {
			example: {
				code: '402',
				message: 'Payment Required',
				details: null,
			} as ErrorResponse<null>,
		},
	})
	@ApiResponse({
		status: 403,
		schema: {
			example: {
				code: '403',
				message: `Forbidden resource`,
				details: null,
			} as ErrorResponse<null>,
		},
	})
	@ApiResponse({
		status: 404,
		schema: {
			example: {
				code: '404',
				message: 'Not found document with that ID',
				details: null,
			} as ErrorResponse<null>,
		},
	})
	@Post('cart-payment')
	async createCartPayment(
		@Body() input: UpdateBillDto,
	): Promise<PaymentResponse> {
		return await this.paymentService.createPayment(input);
	}

	@Public()
	@ApiOperation({
		summary: 'Confirm Payment',
		// description: `Allow customers to confirm a purchase.\n\nRoles: ${UserRole.MEMBER}.`,
	})
	@ApiBody({
		type: CartPaymentRequestDto,
		examples: {
			example1: {
				value: {
					paymentMethod: 'string',
				} as PaymentMethodDto,
			},
		},
	})
	@ApiResponse({
		status: 400,
		schema: {
			example: {
				code: '400',
				message: 'Bad request',
				details: null,
			} as ErrorResponse<null>,
		},
	})
	@ApiResponse({
		status: 401,
		schema: {
			example: {
				code: '401',
				message: 'Unauthorized',
				details: null,
			} as ErrorResponse<null>,
		},
	})
	@ApiResponse({
		status: 402,
		schema: {
			example: {
				code: '402',
				message: 'Payment Required',
				details: null,
			} as ErrorResponse<null>,
		},
	})
	@ApiResponse({
		status: 403,
		schema: {
			example: {
				code: '403',
				message: `Forbidden resource`,
				details: null,
			} as ErrorResponse<null>,
		},
	})
	@ApiResponse({
		status: 404,
		schema: {
			example: {
				code: '404',
				message: 'Not found document with that ID',
				details: null,
			} as ErrorResponse<null>,
		},
	})
	// @Post('confirm/:paymentIntentID/:userId')
	@Post('confirm')
	async confirmPayment(
		// @Param('paymentIntentID') paymentIntentID: string,
		// @Param('userId') userId: string,
		@Body() paymentMethod: PaymentMethodDto,
	): Promise<PaymentResponse> {
		return await this.paymentService.confirmPayment(
			// paymentIntentID,
			paymentMethod,
			// userId,
		);
	}
}
