import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillItemsService } from './bill-items.service';
import { BillItemsController } from './bill-items.controller';
import { BillItem, BillItemSchema } from './schemas/bill-items.schema';
import { ProductSkusModule } from '../product-skus/product-skus.module';
import { DetailCartsModule } from '../detail-carts/detail-carts.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: BillItem.name, schema: BillItemSchema },
		]),
		ProductSkusModule,
		DetailCartsModule,
	],
	providers: [BillItemsService],
	exports: [BillItemsService],
	controllers: [BillItemsController],
})
export class BillItemsModule {}
