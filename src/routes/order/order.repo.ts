import { Injectable } from '@nestjs/common'
import { OrderWhereInput } from 'src/generated/prisma/models'
import {
  NotFoundCartItemException,
  OutOfStockSKUException,
  ProductNotFoundException,
  SKUNotBelongToShopException,
} from 'src/routes/order/order.error'
import {
  CreateOrderBodyType,
  CreateOrderResType,
  GetOrderListQueryType,
  GetOrderListResType,
} from 'src/routes/order/order.model'
import { OrderStatus } from 'src/shared/constants/order.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class OrderRepo {
  constructor(private readonly prisma: PrismaService) {}

  async list({ userId, query }: { userId: number; query: GetOrderListQueryType }): Promise<GetOrderListResType> {
    const { page, limit, status } = query
    const skip = (page - 1) * limit
    const take = limit

    const where: OrderWhereInput = {
      userId,
    }
    if (status) {
      where.status = status
    }

    const totalItems$ = this.prisma.order.count({ where })
    const data$ = this.prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    })

    const [totalItems, data] = await Promise.all([totalItems$, data$])
    return {
      data,
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  async create(userId: number, body: CreateOrderBodyType): Promise<CreateOrderResType> {
    //1, Kiểm tra xem các cartItemIds có tồn tại trong CSDL hay không

    const allBodyCartItemIds = body.flatMap((item) => item.cartItemIds)
    const cartItems = await this.prisma.cartItem.findMany({
      where: {
        userId,
        id: {
          in: allBodyCartItemIds,
        },
      },
      include: {
        sku: {
          include: {
            product: {
              include: {
                productTranslations: true,
              },
            },
          },
        },
      },
    })

    if (cartItems.length !== allBodyCartItemIds.length) {
      throw NotFoundCartItemException
    }

    //2. Kiểm tra số lượng mua có lớn hơn số lượng tồn kho hay không
    const isOutOfStock = cartItems.some((item) => item.sku.stock < item.quantity)

    if (isOutOfStock) {
      throw OutOfStockSKUException
    }

    //3. Kiểm tra xem tất cả sản phẩm mua có sản phẩm nào bị xóa hay ẩn không

    const isProductNotFound = cartItems.some(
      (item) =>
        item.sku.product.deletedAt !== null ||
        item.sku.product.publishedAt === null ||
        item.sku.product.publishedAt > new Date(),
    )
    if (isProductNotFound) {
      throw ProductNotFoundException
    }

    //4. Kiểm tra xem các skuId trong cartItems có thuộc về shopId trong body hay không
    const cartItemMap = new Map<number, (typeof cartItems)[0]>()
    cartItems.forEach((item) => {
      cartItemMap.set(item.id, item)
    })
    const isValidShop = body.every((item) => {
      const bodyCartItemIds = item.cartItemIds
      return bodyCartItemIds.every((cartItemId) => {
        const cartItem = cartItemMap.get(cartItemId)
        return item.shopId === cartItem?.sku.createdById
      })
    })

    if (!isValidShop) {
      throw SKUNotBelongToShopException
    }

    //5. Tạo Order và xóa cartItems trong transaction để đảm bảo tính toàn vẹn dữ liệu
    const orders = await this.prisma.$transaction(async (tx) => {
      const orders = await Promise.all(
        body.map((item) => {
          return tx.order.create({
            data: {
              userId,
              status: OrderStatus.PENDING_PAYMENT,
              receiver: item.receiver,
              shopId: item.shopId,
              items: {
                create: item.cartItemIds.map((cartItemId) => {
                  const cartItem = cartItemMap.get(cartItemId)!
                  return {
                    productName: cartItem.sku.product.name,
                    skuPrice: cartItem.sku.price,
                    image: cartItem.sku.image,
                    skuValue: cartItem.sku.value,
                    skuId: cartItem.skuId,
                    quantity: cartItem.quantity,
                    productId: cartItem.sku.productId,
                    productTranslations: cartItem.sku.product.productTranslations.map((translation) => ({
                      id: translation.id,
                      name: translation.name,
                      description: translation.description,
                      languageId: translation.languageId,
                    })),
                  }
                }),
              },
              products: {
                connect: item.cartItemIds.map((cartItemId) => {
                  const cartItem = cartItemMap.get(cartItemId)!
                  return {
                    id: cartItem.sku.productId,
                  }
                }),
              },
            },
          })
        }),
      )
      await this.prisma.cartItem.deleteMany({
        where: {
          id: {
            in: allBodyCartItemIds,
          },
        },
      })
      return orders
    })

    return {
      data: orders,
    }
  }
}
