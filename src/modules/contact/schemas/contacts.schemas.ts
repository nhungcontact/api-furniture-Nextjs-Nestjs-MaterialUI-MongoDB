import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseObject } from 'src/shared/schemas/base-object.schema';

export type ContactDocument = HydratedDocument<Contact>;

export enum ContactStatus {
	Responsed = 'Responsed',
	NoResponse = 'NoResponse',
}
@Schema({
	timestamps: true,
})

// ProductDetail
export class Contact extends BaseObject {
	@Prop({
		required: true,
		unique: true,
		type: String,
		minlength: 2,
		maxlength: 80,
	})
	username: string;

	@Prop({
		required: true,
		unique: true,
		type: String,
		lowercase: true,
		match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
	})
	email: string;

	@Prop({
		type: String,
		maxlength: 10,
		minlength: 8,
		match: /^\d+$/,
	})
	phoneNumber?: string;

	@Prop({ type: String, required: true })
	contact: string;

	@Prop({
		enum: ContactStatus,
		default: ContactStatus.NoResponse,
		type: String,
	})
	status: ContactStatus;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
