import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from 'src/modules/users/schemas/user.schema';
import { BaseObject } from '../../../shared/schemas/base-object.schema';

export type RequestCancelDocument = HydratedDocument<RequestCancel>;

export enum ProcessingStatus {
	Pending = 'Pending', //Yêu cầu đã được nhận nhưng chưa được xử lý hoặc đánh giá.
	Under_Review = 'Under_Review', //Yêu cầu đang được xem xét bởi người quản lý hoặc hệ thống liên quan.
	Approved = 'Approved', //Yêu cầu hủy đã được chấp nhận, và quá trình hủy đơn hàng sẽ được tiếp tục.
	Denied = 'Denied', //Yêu cầu hủy đã được xem xét và từ chối, nghĩa là đơn hàng sẽ không bị hủy.
}

@Schema()
export class RequestCancel extends BaseObject {
	@Prop({
		required: true,
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	})
	user: User;

	@Prop({
		required: true,
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Bill.',
	})
	bill: string;

	@Prop({ required: true, default: '' })
	reason: string;

	@Prop({ enum: ProcessingStatus, default: ProcessingStatus.Pending })
	processingStatus: ProcessingStatus;
}

export const RequestCancelSchema = SchemaFactory.createForClass(RequestCancel);
