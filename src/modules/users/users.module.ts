import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartsModule } from '../carts/carts.module';
import { PhotoModule } from '../photos/photo.module';
import { RolesModule } from '../roles/roles.module';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
		CartsModule,
		PhotoModule,
		RolesModule,
		// StripeModule.forRoot({
		// 	apiKey: `${appConfig.stripeSecretKey}`,
		// 	apiVersion: '2022-11-15',
		// }),
	],
	providers: [UsersService],
	exports: [UsersService],
	controllers: [UsersController],
})
export class UsersModule {}
