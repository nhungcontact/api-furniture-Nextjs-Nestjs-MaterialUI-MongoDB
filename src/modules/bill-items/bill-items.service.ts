import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { ESortOrder } from 'src/shared/enum/sort.enum';
import { ListOptions, ListResponse } from 'src/shared/response/common-response';
import { BillItem, BillItemDocument } from './schemas/bill-items.schema';
import { CreateBillItemDto } from './dto/create-bill-item.dto';
import { UpdateBillItemDto } from './dto/update-bill-item.dto';
import { SuccessResponse } from 'src/shared/response/success-response';
import { ProductSkusService } from '../product-skus/product-skus.service';
import { CartsService } from '../carts/carts.service';
import { DetailCartsService } from '../detail-carts/detail-carts.service';

@Injectable()
export class BillItemsService {
	constructor(
		@InjectModel(BillItem.name)
		private billItemModel: Model<BillItemDocument>,
		private productSkuService: ProductSkusService,
		private detailCartService: DetailCartsService,
	) {}

	async findOne(filter: Partial<BillItem>): Promise<BillItem> {
		return this.billItemModel.findOne(filter);
	}

	async findOneById(filter: ListOptions<BillItem>): Promise<BillItem> {
		try {
			const data = await this.billItemModel.findById({
				_id: filter._id,
			});

			return data;
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving bill item',
			);
		}
	}

	async findOneByProductSku(filter: Partial<BillItem>): Promise<BillItem> {
		try {
			return await this.billItemModel.findOne(filter);
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving bill item',
			);
		}
	}

	async findAll(
		filter: ListOptions<BillItem>,
	): Promise<ListResponse<BillItem>> {
		try {
			const sortQuery = {};
			sortQuery[filter.sortBy] = filter.sortOrder === ESortOrder.ASC ? 1 : -1;
			const limit = filter.limit || 10;
			const offset = filter.offset || 0;
			const result = await this.billItemModel
				.find(filter)
				.sort(sortQuery)
				.skip(offset)
				.limit(limit);
			return {
				items: result,
				total: result?.length,
				options: filter,
			};
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving Colors',
			);
		}
	}

	async create(input: CreateBillItemDto): Promise<BillItem> {
		try {
			const findProductSku = await this.productSkuService.findOne({
				_id: input.productSkuId,
			});

			if (findProductSku) {
				const updateProductSku = await this.productSkuService.updateOne(
					{
						quantityInStock: findProductSku.quantityInStock - input.quantity,
						quantitySold:
							(findProductSku.quantitySold ? findProductSku.quantitySold : 0) +
							input.quantity,
					},
					findProductSku._id,
				);
				const findPK = await this.productSkuService.findOne({
					_id: updateProductSku._id,
				});
				if (updateProductSku) {
					input.productSku = findPK;
					input.product = findPK.product;
					const name = (Math.random() + 1000000).toString(36).substring(7);
					input.name = name;
					const data = await this.billItemModel.create(input);
					if (data) {
						const findDetailCart = await this.detailCartService.findOne({
							productSku: findProductSku._id,
						});
						const deleteCartItem = await this.detailCartService.deleteOne(
							findDetailCart._id,
						);
						if (deleteCartItem) {
							return data;
						} else {
							throw new BadRequestException('Remove Cart item not success');
						}
					}
				} else {
					throw new BadRequestException('Update Product Sku not success');
				}
			}
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async updateOne(input: UpdateBillItemDto, id: string): Promise<BillItem> {
		try {
			const findBillItem = await this.billItemModel.findOne({
				productSku: id,
			});
			if (findBillItem) {
				const updateBillItem = await this.billItemModel.findOneAndUpdate(
					{ _id: findBillItem._id },
					input,
					{
						new: true,
					},
				);
				if (!updateBillItem) throw new NotFoundException('Product not found');
				return updateBillItem;
			}
		} catch (err) {
			throw new BadRequestException(err);
		}
	}
	async deleteOne({ id }: any): Promise<SuccessResponse<BillItem>> {
		try {
			console.log(id);
			// const findBillItem = await this.billItemModel.findOne({
			// 	productSku: id,
			// });
			// console.log(findBillItem);

			if (!isValidObjectId(id))
				throw new BadRequestException('ID invalid cart item!');

			await this.billItemModel.findOneAndRemove({
				_id: id,
			});

			return;
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async deleteMany(): Promise<SuccessResponse<BillItem>> {
		try {
			await this.billItemModel.deleteMany();
			return;
		} catch (err) {
			throw new BadRequestException(err);
		}
	}
}
