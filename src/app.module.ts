import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { appConfig } from './app.config';
import { GlobalExceptionFilter } from './exception-filters/global-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { AppLoggerMiddleware } from './middleware/logging.middleware';
import { AddressModule } from './modules/address/address.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccessTokenGuard } from './modules/auth/guards/access-token.guard';
import { BillItemsModule } from './modules/bill-items/bill-items.module';
import { BillsModule } from './modules/bills/bills.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { CartsModule } from './modules/carts/carts.module';
import { DetailCartsModule } from './modules/detail-carts/detail-carts.module';
import { GroupPermissionsModule } from './modules/group-permissions/group-permissions.module';
import { OptionValuesModule } from './modules/option-values/option-values.module';
import { OptionsModule } from './modules/options/options.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ProductSkusModule } from './modules/product-skus/product-skus.module';
import { ProductsModule } from './modules/products/product.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { RolesModule } from './modules/roles/roles.module';
import { RoomFurnituresModule } from './modules/room-furnitures/room-furnitures.module';
import { ShippingsModule } from './modules/shippings/shippings.module';
import { SkuValuesModule } from './modules/sku-values/sku-values.module';
import { WarehouseReceiptDetailsModule } from './modules/warehouse-receipt-details/warehouse-receipt-details.module';
import { WarehouseReceiptsModule } from './modules/warehouse-receipts/warehouse-receipts.module';
import { PhotoModule } from './modules/photos/photo.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ContactsModule } from './modules/contact/contacts.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
	imports: [
		MongooseModule.forRoot(appConfig.mongoURI),
		AuthModule,
		AddressModule,
		PhotoModule,
		RoomFurnituresModule,

		RolesModule,
		PermissionsModule,
		GroupPermissionsModule,
		ProductsModule,
		OptionsModule,
		OptionValuesModule,
		ProductSkusModule,
		SkuValuesModule,
		BlogsModule,
		AddressModule,
		ShippingsModule,
		WarehouseReceiptsModule,
		WarehouseReceiptDetailsModule,
		PromotionsModule,
		// DisplayOptionsModule,
		CartsModule,
		DetailCartsModule,
		BillsModule,
		BillItemsModule,
		PaymentsModule,
		ContactsModule,
		WebhooksModule,
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: AccessTokenGuard,
		},
		{
			provide: APP_FILTER,
			useClass: GlobalExceptionFilter,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseInterceptor,
		},
	],
})
export class AppModule {
	configure(consumer: MiddlewareConsumer): void {
		consumer.apply(AppLoggerMiddleware).forRoutes('*');
	}

	constructor() {
		console.log({ appConfig });
	}
}
