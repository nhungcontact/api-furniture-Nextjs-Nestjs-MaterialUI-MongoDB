import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProcessingStatus } from '../schemas/request-cancels.schema';

export class CreateRequestCancelDto {
	@ApiProperty()
	// @IsOptional()
	@IsNotEmpty()
	@IsString()
	bill: string;

	@ApiProperty()
	// @IsOptional()
	@IsNotEmpty()
	@IsString()
	user: string;

	@IsOptional()
	@IsNotEmpty()
	reason: string;

	@IsOptional()
	@IsNotEmpty()
	processingStatus: ProcessingStatus;
}
