import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { Public } from '../auth/decorators/public.decorator';
import { OptionValuesService } from '../option-values/option-values.service';
import { ProductSkusService } from '../product-skus/product-skus.service';
import { CategoriesService } from '../categories/categories.service';

@Controller('webhooks')
export class WebhooksController {
	constructor(
		private readonly productService: ProductsService,
		private readonly optionValueService: OptionValuesService,
		private readonly productSkuService: ProductSkusService,
		private readonly categoryService: CategoriesService,
	) {}

	@Public()
	@Post()
	async handleWebhook(@Body() body: any): Promise<any> {
		console.log(body);
		const intentName = body.queryResult.intent.displayName;
		// const intentName = 'Tuvansanpham';
		let responseText = [''];
		let imageText = {
			image: {
				imageUri: '',
				accessibilityText: '',
			},
		};
		const category = body.queryResult.queryText;

		switch (intentName) {
			case 'Tuvansanpham':
				const findCat = await this.categoryService.findAll({
					search: category,
				});
				console.log(findCat);

				if (findCat && findCat.items && findCat.items.length) {
					if (findCat.items.length > 1) {
						responseText = [
							`Bạn muốn tư vấn cụ thể loại sản phẩm ${findCat.items.map(
								(item, index) =>
									`${item.name} ${
										index !== findCat.items.length - 1 && `,`
									}, hãy nhập một loại `,
							)}`,
						];
					} else {
						const findProduct = await this.productService.findAllProduct({
							category: findCat.items[0]._id.toString(),
						});

						if (findProduct && findProduct.items && findProduct.items.length) {
							console.log(findProduct);
							const productText = [];
							findProduct.items.forEach((value) =>
								productText.push(`- ${value.name}`),
							);
							responseText = [
								`Dựa trên yêu cầu của bạn, chúng tôi đề xuất "${findCat.items[0].name}" gồm những sản phẩm:`,
								...productText,
							];
						}
					}
				} else {
					console.log('category', category);
					const findProduct = await this.productService.findAllProduct({
						search: category,
					});
					// console.log('findProduct', findProduct);
					if (findProduct) {
						if (findProduct.items.length < 2) {
							const productSku = await this.productSkuService.findAllByProduct(
								{},
								findProduct.items[0]._id.toString(),
							);

							if (
								productSku &&
								productSku.items &&
								productSku.items.length &&
								productSku.items[0].optionValues
							) {
								responseText = [
									`- Name: ${findProduct.items
										.map((product) => `${product.name}`)
										.join(', ')}`,
									`- ${productSku.items[0].optionValues
										.map(
											(item, index) =>
												`${item.name} ${
													index !== findCat.items.length - 1 && `,`
												}`,
										)
										.join('')}`,
									`- Link sản phẩm: http://localhost:3001/furniture/product/product-detail/${findProduct.items[0]._id}`,
									`Bạn muốn biết thêm thông tin vui lòng nhấn:`,
									`	1. Lựa chọn (Giá, màu sắc,...) + tên sản phẩm`,
									`Ví dụ: Giá "-" sofa da đen `,
								];
								imageText = {
									image: {
										imageUri: `${productSku.items[0].photos[0].imageURL}`,
										accessibilityText: `${productSku.items[0].optionValues
											.map((item) => item.name)
											.join('')}`,
									},
								};
								console.log(imageText);
							}
						} else {
							const productText = [''];
							findProduct.items.forEach((value) =>
								productText.push(`- ${value.name}`),
							);
							responseText = [
								`Các sản  phẩm tương ứng yêu cầu gồm: `,
								...productText,
							];
						}
					} else {
						responseText = [
							'Hiện tại bên cửa hàng chưa có loại sản phẩm này, cửa hàng có rất nhiều loại sản phẩm nổi bật khác như Giường, Ghế cao cấp, Sofa bọc vải,..',
						];
					}
				}
				break;

			case 'Giaca':
				console.log('Gia ca', category);
				const text = category.split('-');
				const trimmedResult = text.map((word) => word.trim());
				console.log(trimmedResult[1]);
				const findProduct = await this.productService.findAllProduct({
					search: trimmedResult[1],
				});
				if (findProduct && findProduct.items) {
					if (findProduct.items.length > 1) {
						const productText = [];
						findProduct.items.forEach(async (value) => {
							productText.push(`${value.name} `);
						});

						responseText = [
							`Thông tin sản phẩm dựa trên yêu cần của bạn gồm: `,
							...productText,
							`Bạn muốn biết thêm thông tin vui lòng nhấn:`,
							`	1. Lựa chọn (Giá, màu sắc,...) + tên sản phẩm`,
							`Ví dụ: Giá "-" sofa da đen `,
						];
					} else {
						const textArray = [];
						const productSku = await this.productSkuService.findAllByProduct(
							{},
							findProduct.items[0]._id.toString(),
						);
						productSku.items.map((item) =>
							textArray.push(
								`	+ Giá : ${new Intl.NumberFormat('vi-VN', {
									style: 'currency',
									currency: 'VND',
								}).format(
									item.priceDiscount ? item.priceDiscount : item.price,
								)}, ${item.optionValues.map((i) => `${i.name} `).join('')}`,
							),
						);

						responseText = [
							`- ${findProduct.items[0].name}`,
							...textArray,
							`- Link sản phẩm: http://localhost:3001/furniture/product/product-detail/${findProduct.items[0]._id}`,
						];
					}
				} else {
					responseText = ['Xin lỗi, Bạn có thể nhập lại yêu cầu giúp tôi.'];
				}
				break;

			case 'Mausac':
				console.log('Mau sac', category);
				const textM = category.split('-');

				if (textM) {
					const trimmedResultM = textM.map((word) => word.trim());
					const findProductM = await this.productService.findAllProduct({
						search: trimmedResultM[1],
					});
					if (findProductM && findProductM.items) {
						if (findProductM.items.length > 1) {
							const productText = [];
							findProductM.items.forEach(async (value) => {
								productText.push(`${value.name} `);
							});

							responseText = [
								`Thông tin sản phẩm dựa trên yêu cầu của bạn gồm: `,
								...productText,
								`Bạn muốn biết thêm thông tin vui lòng nhấn:`,
								`	1. Lựa chọn (Giá, màu sắc,...) + tên sản phẩm`,
								`Ví dụ: Giá "-" sofa da đen `,
							];
						} else {
							const textArrayM = [];
							const productSku = await this.productSkuService.findAllByProduct(
								{},
								findProduct.items[0]._id.toString(),
							);
							productSku.items.map((item) =>
								textArrayM.push(
									`	+ Giá : ${new Intl.NumberFormat('vi-VN', {
										style: 'currency',
										currency: 'VND',
									}).format(
										item.priceDiscount ? item.priceDiscount : item.price,
									)}, ${item.optionValues.map((i) => `${i.name} `).join('')}`,
								),
							);

							responseText = [
								`- ${findProduct.items[0].name}`,
								...textArrayM,
								`- Link sản phẩm: http://localhost:3001/furniture/product/product-detail/${findProduct.items[0]._id}`,
							];
						}
					} else {
						responseText = ['Xin lỗi, Bạn có thể nhập lại yêu cầu giúp tôi.'];
					}
				} else {
					const textMM = category.split(',');
					const trimmedResultM = textMM.map((word) => word.trim());
					// const productName = body.queryResult;
					if (
						trimmedResultM &&
						trimmedResultM.length &&
						trimmedResultM.length > 0
					) {
						const ids = [] as any;

						for (const val of trimmedResultM) {
							const optionValue = await this.optionValueService.findAll({
								search: val,
							});
							console.log('optionValue', optionValue);
							if (
								optionValue &&
								optionValue.items &&
								optionValue.items.length
							) {
								ids.push(optionValue.items.map((item) => item._id)[0]);
							}
						}
						console.log('ids', ids);

						const productSkus = await this.productSkuService.findAll({
							optionValues: ids,
						});

						if (productSkus && productSkus.items) {
							const uniqueProductIds = new Set();

							// Filter out duplicates based on product name
							const uniqueProducts = productSkus.items.filter((productSku) => {
								const productId = productSku.product._id.toString(); // Convert ObjectId to string

								if (!uniqueProductIds.has(productId)) {
									uniqueProductIds.add(productId);
									return true;
								}

								return false;
							});
							console.log(uniqueProducts);
							if (
								uniqueProducts &&
								uniqueProducts.length &&
								uniqueProducts.length > 0
							) {
								const textArrayUN = [];
								uniqueProducts.map((item) =>
									textArrayUN.push(`	+ ${item.product.name}`),
								);
								responseText = [
									`Sản phẩm tương ứng yêu cầu ${trimmedResultM
										.map((item1) => `${item1}`)
										.join('')}: `,
									...textArrayUN,
								];
							} else {
								responseText = [
									'Xin lỗi, Bạn có thể nhập lại yêu cầu giúp tôi.',
								];
							}
						}
					} else {
						const textMM = category.split('+');
						const trimmedResultM = textMM.map((word) => word.trim());
						if (trimmedResultM && trimmedResultM.length > 0) {
							const product = await this.productService.findAllProduct({
								category: trimmedResultM[0],
							});
							const optionValue = await this.optionValueService.findOne({
								name: trimmedResultM[1],
							});
							if (optionValue._id && product && product.items) {
								const productSkus = await this.productSkuService.findAll({
									optionValues: [optionValue._id as any],
								});
								const textArr = [];
								productSkus.items.map((item) =>
									textArr.push(`${item.product.name}`),
								);
								responseText = [
									`Sản phẩm ${trimmedResultM[0]}, ${trimmedResultM[1]}:`,
									...textArr,
								];
							}
						} else {
							responseText = [
								`Bạn hãy nhập : Danh mục (ghế, sofa,...) + màu sắc (trắng, đen,....)`,
								`vd: Ghế + màu trắng`,
							];
						}
					}
				}

				break;
			default:
				responseText = ['Xin lỗi, tôi không hiểu yêu cầu của bạn.'];
		}
		// const response = {
		// 	fulfillmentText: responseText,
		// };
		const response = {
			fulfillmentMessages: [
				{
					text: {
						text: responseText,
					},
				},

				imageText,
			],
		};
		return response;

		// // const productName = body.queryResult;
		// const productName = ['trắng', 'đỏ'];
		// const ids = [] as any;

		// for (const val of productName) {
		// 	console.log(val);
		// 	const optionValue = await this.optionValueService.findAll({
		// 		search: val,
		// 	});
		// 	console.log('optionValue', optionValue);
		// 	if (optionValue && optionValue.items && optionValue.items.length) {
		// 		ids.push(optionValue.items.map((item) => item._id)[0]);
		// 	}
		// }
		// console.log('ids', ids);

		// const productSkus = await this.productSkuService.findAll({
		// 	optionValues: ids,
		// });

		// if (productSkus && productSkus.items) {
		// 	const uniqueProductIds = new Set();

		// 	// Filter out duplicates based on product name
		// 	const uniqueProducts = productSkus.items.filter((productSku) => {
		// 		const productId = productSku.product._id.toString(); // Convert ObjectId to string

		// 		if (!uniqueProductIds.has(productId)) {
		// 			uniqueProductIds.add(productId);
		// 			return true;
		// 		}

		// 		return false;
		// 	});
		// 	console.log(uniqueProducts);

		// 	return uniqueProducts;
		// }

		// return this.productService.getProductsByOptionValues(ids);

		// Use ProductService to retrieve product information
		// const products = await this.productService.findAllProduct({
		// 	search: productName,
		// });
		// if (products && products.items) {
		// 	const response = {
		// 		fulfillmentText: `List of products: ${products.items
		// 			.map((product) => product.name)
		// 			.join(', ')}`,
		// 	};
		// 	return response;
		// }
		// return [];
	}
}
