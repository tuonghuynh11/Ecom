import { Injectable } from '@nestjs/common'
import {
  NotEnoughStockSKUException,
  NotFoundSKUException,
  OutOfStockSKUException,
  ProductNotFoundException,
} from 'src/routes/cart/cart.error'
import {
  AddToCartBodyType,
  CartItemDetailType,
  CartItemType,
  DeleteCartBodyType,
  GetCartResType,
  UpdateCartItemBodyType,
} from 'src/routes/cart/cart.model'
import { ALL_LANGUAGES_CODE } from 'src/shared/constants/other.constant'
import { SKUSchemaType } from 'src/shared/models/shared-sku.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class CartRepo {
  constructor(private readonly prismaService: PrismaService) {}

  private async validateSKU(skuId: number, quantity: number): Promise<SKUSchemaType> {
    const sku = await this.prismaService.sKU.findUnique({
      where: { id: skuId, deletedAt: null },
      include: {
        product: true,
      },
    })
    // Kiểm tra tồn tại của SKU
    if (!sku) {
      throw NotFoundSKUException
    }
    // Kiểm tra lượng hàng còn lại
    if (sku.stock < 1) {
      throw OutOfStockSKUException
    }

    if (sku.stock < quantity) {
      throw NotEnoughStockSKUException
    }

    const { product } = sku

    // Kiểm tra sản phẩm đã bị xóa hoặc có công khai hay không
    if (
      product.deletedAt !== null ||
      product.publishedAt === null ||
      (product.publishedAt !== null && product.publishedAt > new Date())
    ) {
      throw ProductNotFoundException
    }
    return sku as any
  }

  async list({
    userId,
    languageId,
    page,
    limit,
  }: {
    userId: number
    languageId: string
    limit: number
    page: number
  }): Promise<GetCartResType> {
    // const cartItems = await this.prismaService.cartItem
    //   .findMany({
    //     where: {
    //       userId,
    //       sku: {
    //         product: {
    //           deletedAt: null,
    //           publishedAt: {
    //             lte: new Date(),
    //             not: null,
    //           },
    //           createdBy: {
    //             not: null,
    //           },
    //         },
    //       },
    //     },
    //     orderBy: {
    //       updatedAt: 'desc',
    //     },
    //     include: {
    //       sku: {
    //         include: {
    //           product: {
    //             include: {
    //               productTranslations: {
    //                 where: languageId === ALL_LANGUAGES_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
    //               },
    //               createdBy: true,
    //             },
    //           },
    //         },
    //       },
    //     },
    //   })
    //   .then((items) => {
    //     const groupItemsByShop = items.reduce((acc: any, item: any) => {
    //       if (acc[item.sku.product.createdBy.id]) {
    //         acc[item.sku.product.createdBy.id].cartItems.push(item)
    //       } else {
    //         acc[item.sku.product.createdBy.id] = {
    //           shop: {
    //             id: item.sku.product.createdBy.id,
    //             name: item.sku.product.createdBy.name,
    //             avatar: item.sku.product.createdBy.avatar,
    //           },
    //           cartItems: [item],
    //         }
    //       }
    //     }, {})

    //     const result: CartItemDetailType[] = Object.values(groupItemsByShop)
    //     return result
    //   })

    const cartItems = (await this.prismaService.cartItem.findMany({
      where: {
        userId,
        sku: {
          product: {
            deletedAt: null,
            publishedAt: {
              lte: new Date(),
              not: null,
            },
          },
        },
      },
      include: {
        sku: {
          include: {
            product: {
              include: {
                productTranslations: {
                  where: languageId === ALL_LANGUAGES_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
                },
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })) as any
    const groupMap = new Map<number, CartItemDetailType>()
    for (const cartItem of cartItems) {
      const shopId = cartItem.sku.product.createdById
      if (shopId) {
        if (!groupMap.has(shopId)) {
          groupMap.set(shopId, { shop: cartItem.sku.product.createdBy, cartItems: [] })
        }
        groupMap.get(shopId)?.cartItems.push(cartItem)
      }
    }
    const sortedGroups = Array.from(groupMap.values())
    const skip = (page - 1) * limit
    const take = limit
    const totalGroups = sortedGroups.length
    const pagedGroups = sortedGroups.slice(skip, skip + take)
    return {
      data: pagedGroups,
      totalItems: totalGroups,
      limit,
      page,
      totalPages: Math.ceil(totalGroups / limit),
    }
  }

  async create(userId: number, body: AddToCartBodyType): Promise<CartItemType> {
    await this.validateSKU(body.skuId, body.quantity)

    return this.prismaService.cartItem.create({
      data: {
        userId,
        skuId: body.skuId,
        quantity: body.quantity,
      },
    })
  }

  async update(cartItemId: number, body: UpdateCartItemBodyType): Promise<CartItemType> {
    await this.validateSKU(body.skuId, body.quantity)

    return this.prismaService.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: {
        skuId: body.skuId,
        quantity: body.quantity,
        updatedAt: new Date(),
      },
    })
  }

  delete(userId: number, body: DeleteCartBodyType): Promise<{ count: number }> {
    return this.prismaService.cartItem.deleteMany({
      where: {
        id: {
          in: body.cartItemIds,
        },
        userId,
      },
    })
  }
}
