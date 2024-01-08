import { PartialType } from '@nestjs/swagger';
import { CreateBillDto } from './create-bill.dto';
import { IsOptional, IsString } from 'class-validator';
import { CreateRequestCancelDto } from 'src/modules/request-cancel/dto/create-request-cancel.dto';

export class UpdateBillDto extends PartialType(CreateBillDto) {
	@IsOptional()
	@IsString()
	billId?: string;

	@IsOptional()
	// @IsEnum(BillStatus)
	requestCancel?: CreateRequestCancelDto;
}
