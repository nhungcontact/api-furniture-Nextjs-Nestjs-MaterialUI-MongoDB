import { Module } from '@nestjs/common';
import { StripeModule } from 'nestjs-stripe';
import { appConfig } from 'src/app.config';
import { UsersModule } from '../users/users.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BillsModule } from '../bills/bills.module';

@Module({
	imports: [
		// BillItemsModule,
		BillsModule,
		// SubscriptionsModule,
		// CartsModule,
		// CartItemsModule,

		UsersModule,
		StripeModule.forRoot({
			apiKey: `${appConfig.stripeSecretKey}`,
			apiVersion: '2022-11-15',
		}),
	],
	providers: [PaymentsService],
	controllers: [PaymentsController],
})
export class PaymentsModule {}
