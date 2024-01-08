import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ListOptions, ListResponse } from 'src/shared/response/common-response';
import { CreateRequestCancelDto } from './dto/create-request-cancel.dto';
import {
	RequestCancel,
	RequestCancelDocument,
} from './schemas/request-cancels.schema';

@Injectable()
export class RequestCancelsService {
	constructor(
		@InjectModel(RequestCancel.name)
		private requestCancelModel: Model<RequestCancelDocument>,
	) {}

	async findOne(filter: Partial<RequestCancel>): Promise<RequestCancel> {
		try {
			return await this.requestCancelModel.findOne(filter);
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving RequestCancels',
			);
		}
	}

	async findMany(
		filter: ListOptions<RequestCancel>,
	): Promise<ListResponse<RequestCancel>> {
		try {
			const sortQuery = {};
			sortQuery[filter.sortBy] = filter.sortOrder === 'asc' ? 1 : -1;
			const limit = filter.limit || 10;
			const offset = filter.offset || 0;

			const result = await this.requestCancelModel
				.find(filter)
				.sort(sortQuery)
				.skip(offset)
				.limit(limit)
				.populate(['bill', 'user']);
			return {
				items: result,
				total: result?.length,
				options: filter,
			};
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving request cancel',
			);
		}
	}

	async createOrderRequest(input: CreateRequestCancelDto) {
		if (input) {
			const create = await this.requestCancelModel.create(input);
			if (!create) {
				throw new BadRequestException('Create request cancel not success');
			}
			return create;
		}
	}

	async updateOne(
		input: CreateRequestCancelDto,
		id: string,
	): Promise<RequestCancel> {
		const deletedReview = await this.requestCancelModel.findOneAndUpdate(
			{
				_id: id,
			},
			{
				...input,
				processingStatus: input.processingStatus,
			},
			{
				new: true,
			},
		);
		return deletedReview;
	}

	async delete(id: string): Promise<RequestCancel> {
		const deletedReview = await this.requestCancelModel.findOneAndDelete({
			_id: id,
		});
		return deletedReview;
	}
	async deleteMany(): Promise<string> {
		await this.requestCancelModel.deleteMany();
		return 'Delete Many success';
	}
}
