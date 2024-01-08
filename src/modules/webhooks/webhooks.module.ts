import { Module } from '@nestjs/common';
import { OptionValuesModule } from '../option-values/option-values.module';
import { ProductSkusModule } from '../product-skus/product-skus.module';
import { ProductsModule } from '../products/product.module';
import { WebhooksController } from './webhooks.controllers';
import { CategoriesModule } from '../categories/categories.module';

@Module({
	imports: [
		ProductsModule,
		ProductSkusModule,
		OptionValuesModule,
		CategoriesModule,
		// MongooseModule.forFeature([{ name: Webhook.name, schema: WebhookSchema }]),
	],
	controllers: [WebhooksController],
})
export class WebhooksModule {}
