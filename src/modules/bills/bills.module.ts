import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillItemsModule } from '../bill-items/bill-items.module';
import { EmailModule } from '../emails/emails.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { UsersModule } from '../users/users.module';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { Bill, BillSchema } from './schemas/bills.schema';
import { RequestCancelsModule } from '../request-cancel/request-cancels.module';
import { ProductSkusModule } from '../product-skus/product-skus.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Bill.name, schema: BillSchema }]),
		BillItemsModule,
		PromotionsModule,
		UsersModule,
		EmailModule,
		RequestCancelsModule,
		ProductSkusModule,
	],
	providers: [BillsService],
	exports: [BillsService],
	controllers: [BillsController],
})
export class BillsModule {}
