import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestCancelsService } from './request-cancels.service';
import {
	RequestCancel,
	RequestCancelSchema,
} from './schemas/request-cancels.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: RequestCancel.name,
				schema: RequestCancelSchema,
			},
		]),
	],
	providers: [RequestCancelsService],
	exports: [RequestCancelsService],
	// controllers: [WarehouseReceiptDetailsController],
})
export class RequestCancelsModule {}
