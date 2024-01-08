import { MongooseModule } from '@nestjs/mongoose';
import { seeder } from 'nestjs-seeder';
import { appConfig } from './app.config';

import {
	Commune,
	CommuneSchema,
} from './modules/address/schemas/commune.schema';
import {
	District,
	DistrictSchema,
} from './modules/address/schemas/district.schema';
import {
	Province,
	ProvinceSchema,
} from './modules/address/schemas/province.schema';
import { AdministrativeUnitSeeder } from './seeder/administrative-unit-seeder';

seeder({
	imports: [
		MongooseModule.forRoot(appConfig.mongoURI),
		MongooseModule.forFeature([
			{ name: Province.name, schema: ProvinceSchema },
		]),
		MongooseModule.forFeature([
			{ name: District.name, schema: DistrictSchema },
		]),
		MongooseModule.forFeature([{ name: Commune.name, schema: CommuneSchema }]),
		// MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
		// MongooseModule.forFeature([
		// 	{ name: Facility.name, schema: FacilitySchema },
		// ]),
		// MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
		// MongooseModule.forFeature([
		// 	{ name: FacilityCategory.name, schema: FacilityCategorySchema },
		// ]),
		// MongooseModule.forFeature([{ name: Photo.name, schema: PhotoSchema }]),
		// MongooseModule.forFeature([
		// 	{ name: FacilitySchedule.name, schema: FacilityScheduleSchema },
		// ]),
		// MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }]),
		// MongooseModule.forFeature([
		// 	{ name: PackageType.name, schema: PackageTypeSchema },
		// ]),
		// MongooseModule.forFeature([{ name: Package.name, schema: PackageSchema }]),
		// MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
		// MongooseModule.forFeature([{ name: Bill.name, schema: BillSchema }]),
		// MongooseModule.forFeature([
		// 	{ name: Subscription.name, schema: SubcriptionSchema },
		// ]),
		// MongooseModule.forFeature([
		// 	{ name: BillItem.name, schema: BillItemSchema },
		// ]),
		// MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
	],
}).run([
	AdministrativeUnitSeeder,
	// BrandSeeder,
	// FacilitySeeder,
	// CategorySeeder,
	// ReviewSeeder,
	// PhotoSeeder,
	// ScheduleSeeder,
	// CounterSeeder,
	// PackageSeeder,
	// PackageTypeSeeder,
	// UserSeeder,
	// BillItemSeeder,
	// BillSeeder,
	// SubscriptionSeeder,
	// CartSeeder,
]);
