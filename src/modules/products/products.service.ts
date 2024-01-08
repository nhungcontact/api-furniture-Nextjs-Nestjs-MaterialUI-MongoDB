import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ESortOrder } from 'src/shared/enum/sort.enum';
import { ListOptions, ListResponse } from 'src/shared/response/common-response';
import { SuccessResponse } from 'src/shared/response/success-response';
import { CategoriesService } from '../categories/categories.service';
import { ProductSkusService } from '../product-skus/product-skus.service';
import { RoomFurnituresService } from '../room-furnitures/room-furnitures.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/products.schema';

@Injectable()
export class ProductsService {
	constructor(
		@InjectModel(Product.name)
		private productModel: Model<ProductDocument>,
		private roomFurnitureService: RoomFurnituresService,
		private categoryService: CategoriesService,
		// private skuValueService: SkuValuesService,
		private productSkuService: ProductSkusService,
	) {}

	async findOne(filter: Partial<Product>): Promise<Product> {
		try {
			return await this.productModel.findOne(filter);
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving Products',
			);
		}
	}

	async findOneProduct(id: string): Promise<Product> {
		try {
			return await this.productModel
				.findOne({
					_id: id,
				})
				.populate([
					{
						path: 'productSkus',
						populate: [
							{ path: 'optionValues', populate: 'optionSku' },
							{ path: 'product' },
							{ path: 'reviews' },
						],
					},
					'category',
					'roomFurniture',
				]);
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving Products',
			);
		}
	}

	async count(filter: any): Promise<number> {
		const result: number = await this.productModel.count({
			$and: filter,
		});
		return result || 0;
	}

	async findAllProduct(
		filter: ListOptions<Product>,
	): Promise<ListResponse<Product>> {
		try {
			console.log(filter.search);
			const rgx = (pattern) => new RegExp(`.*${pattern}.*`, 'i');

			const query: any = filter.search
				? { ...filter, name: rgx(filter.search) }
				: { ...filter };

			if (filter.isHidden) {
				query['isHidden'] = filter.isHidden;
			}
			if (filter.category) {
				query['category'] = filter.category;
			}
			const sortQuery = {};
			sortQuery[filter.sortBy] = filter.sortOrder === ESortOrder.ASC ? 1 : -1;
			const limit = filter.limit || 10;
			const offset = filter.offset || 0;
			console.log('query', query);
			const result = await this.productModel
				.find(query)
				.sort(sortQuery)
				.skip(offset)
				.limit(limit)
				.populate([
					{
						path: 'productSkus',
						populate: [
							{ path: 'optionValues', populate: 'optionSku' },
							{ path: 'product' },
							{ path: 'reviews' },
						],
					},
					'category',
					'roomFurniture',
				]);

			return {
				items: result,
				total: result?.length,
				options: filter,
			};
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving Products',
			);
		}
	}

	async getProductsHaveFilterQuantity(
		filter: ListOptions<Product>,
	): Promise<ListResponse<Product>> {
		try {
			const rgx = (pattern) => new RegExp(`.*${pattern}.*`);

			const sortQuery = {};
			sortQuery[filter.sortBy] = filter.sortOrder === ESortOrder.ASC ? 1 : -1;
			const limit = filter.limit || 10;
			const offset = filter.offset || 0;

			// Build the MongoDB query based on the filter
			const query: any = filter.search
				? { ...filter, name: rgx(filter.search) }
				: { ...filter };

			const result = await this.productModel
				.find(query)
				.sort(sortQuery)
				.skip(offset)
				.limit(limit)
				.populate([
					{
						path: 'productSkus',
						populate: [
							{ path: 'optionValues', populate: 'optionSku' },
							{ path: 'product' },
							{ path: 'reviews' },
						],
					},
					'category',
					'roomFurniture',
				]);

			return {
				items: result,
				total: result?.length,
				options: filter,
			};
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving Products',
			);
		}
	}
	async createProduct(input: CreateProductDto): Promise<Product> {
		try {
			console.log('create prodoct', input);
			const findProduct = await this.productModel.findOne({
				name: input.name,
			});
			if (!findProduct) {
				const findCat = await this.categoryService.findOne({
					_id: input.category,
				});
				const findRoom = await this.roomFurnitureService.findOne({
					_id: input.roomFurniture,
				});
				if (findCat && findRoom) {
					const arr = findCat.roomFurnitures.filter(
						(item) => item._id !== findRoom._id,
					);
					if (arr) {
						input.category = findCat._id;
						input.roomFurniture = findRoom._id;
						const createProduct = await this.productModel.create(input);
						return await createProduct;
					} else {
						throw new BadRequestException(
							'Category has exited in Room Furniture!',
						);
					}
				} else {
					throw new BadRequestException(
						'Category or Room furniture, Brand has exited!',
					);
				}
			}
			throw new BadRequestException('Product has exited!');
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async updateProduct(
		input: UpdateProductDto,
		productID: string,
	): Promise<Product> {
		try {
			const product = await this.productModel.findOneAndUpdate(
				{ _id: productID },
				input,
				{
					new: true,
				},
			);
			if (!product) throw new NotFoundException('Product not found');
			return await product.save();
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async deleteOne(id: string): Promise<Product> {
		try {
			const findProductSku = await this.productSkuService.findAllByProduct(
				{},
				id,
			);
			if (findProductSku && findProductSku.items) {
				for (const val of findProductSku.items) {
					if (val._id.toString()) {
						await this.productSkuService.deleteOne(val._id.toString());
					}
				}
			}
			const deletePR = await this.productModel.findOneAndRemove({
				_id: id,
			});

			return deletePR;
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async deleteMany(): Promise<SuccessResponse<Product>> {
		try {
			await this.productModel.deleteMany();
			return;
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async getProductsMostSoldByCategory(): Promise<any[]> {
		try {
			const result = await this.productModel.aggregate([
				{
					$group: {
						_id: '$category',
						totalQuantitySold: { $sum: '$quantitySold' },
						products: {
							$push: {
								_id: '$_id',
								name: '$name',
								quantitySold: '$quantitySold',
							},
						},
					},
				},
				{
					$sort: { totalQuantitySold: -1 },
				},
				{
					$lookup: {
						from: 'categories', // Adjust the collection name as needed
						localField: '_id',
						foreignField: '_id',
						as: 'categoryData',
					},
				},
				{
					$unwind: '$categoryData', // Unwind to access the nested category data
				},
				{
					$project: {
						_id: 0,
						category: {
							_id: '$categoryData._id',
							name: '$categoryData.name',
						},
						totalQuantitySold: 1,
						products: { $slice: ['$products', 8] },
					},
				},
			]);

			console.log('result', result);
			return result;
		} catch (error) {
			console.error('Error in getProductsMostSoldByCategory:', error);
			throw error; // Handle or log the error as needed
		}
	}
}
