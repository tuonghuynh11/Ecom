/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable } from '@nestjs/common'
import { OrderWhereInput } from 'src/generated/prisma/models'
import {
  CannotCancelOrderException,
  NotFoundCartItemException,
  OrderNotFoundException,
  OutOfStockSKUException,
  ProductNotFoundException,
  SKUNotBelongToShopException,
} from 'src/routes/order/order.error'
import {
  CancelOrderResType,
  CreateOrderBodyType,
  CreateOrderResType,
  GetOrderDetailResType,
  GetOrderListQueryType,
  GetOrderListResType,
} from 'src/routes/order/order.model'
import { OrderProducer } from 'src/routes/order/order.producer'
import { OrderStatus } from 'src/shared/constants/order.constant'
import { PaymentStatus } from 'src/shared/constants/payment.constant'
import { SerializeAll } from 'src/shared/decorators/serialize.decorator'
import { ServerOverloadException } from 'src/shared/error'
import { createPaymentVietQR, isNotFoundPrismaError } from 'src/shared/helpers'
import { redlock } from 'src/shared/redis'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
@SerializeAll()
export class OrderRepo {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderProducer: OrderProducer,
  ) {}

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
      data: data as any,
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  /// ## Using Pessimistic Locking to prevent race conditions when creating orders

  // async create(
  //   userId: number,
  //   body: CreateOrderBodyType,
  // ): Promise<{
  //   paymentId: number
  //   paymentQR: string
  //   orders: CreateOrderResType['data']
  // }> {
  //   // 1. Kiểm tra xem tất cả cartItemIds có tồn tại trong cơ sở dữ liệu hay không
  //   // 2. Kiểm tra số lượng mua có lớn hơn số lượng tồn kho hay không
  //   // 3. Kiểm tra xem tất cả sản phẩm mua có sản phẩm nào bị xóa hay ẩn không
  //   // 4. Kiểm tra xem các skuId trong cartItem gửi lên có thuộc về shopid gửi lên không
  //   // 5. Tạo order
  //   // 6. Xóa cartItem
  //   const [payment, orders, paymentQR] = await this.prisma.$transaction(async (tx) => {
  //     const allBodyCartItemIds = body.map((item) => item.cartItemIds).flat()
  //     const cartItemsForSKUId = await tx.cartItem.findMany({
  //       where: {
  //         id: {
  //           in: allBodyCartItemIds,
  //         },
  //         userId,
  //       },
  //       select: {
  //         skuId: true,
  //       },
  //     })
  //     const skuIds = cartItemsForSKUId.map((cartItem) => cartItem.skuId)
  //     await tx.$queryRaw`SELECT * FROM "SKU" WHERE id IN (${Prisma.join(skuIds)}) FOR UPDATE`
  //     const cartItems = await tx.cartItem.findMany({
  //       where: {
  //         id: {
  //           in: allBodyCartItemIds,
  //         },
  //         userId,
  //       },
  //       include: {
  //         sku: {
  //           include: {
  //             product: {
  //               include: {
  //                 productTranslations: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     })

  //     // 1. Kiểm tra xem tất cả cartItemIds có tồn tại trong cơ sở dữ liệu hay không
  //     if (cartItems.length !== allBodyCartItemIds.length) {
  //       throw NotFoundCartItemException
  //     }

  //     // 2. Kiểm tra số lượng mua có lớn hơn số lượng tồn kho hay không
  //     const isOutOfStock = cartItems.some((item) => {
  //       return item.sku.stock < item.quantity
  //     })
  //     if (isOutOfStock) {
  //       throw OutOfStockSKUException
  //     }

  //     // 3. Kiểm tra xem tất cả sản phẩm mua có sản phẩm nào bị xóa hay ẩn không
  //     const isExistNotReadyProduct = cartItems.some(
  //       (item) =>
  //         item.sku.product.deletedAt !== null ||
  //         item.sku.product.publishedAt === null ||
  //         item.sku.product.publishedAt > new Date(),
  //     )
  //     if (isExistNotReadyProduct) {
  //       throw ProductNotFoundException
  //     }

  //     // 4. Kiểm tra xem các skuId trong cartItem gửi lên có thuộc về shopid gửi lên không
  //     const cartItemMap = new Map<number, (typeof cartItems)[0]>()
  //     cartItems.forEach((item) => {
  //       cartItemMap.set(item.id, item)
  //     })
  //     const isValidShop = body.every((item) => {
  //       const bodyCartItemIds = item.cartItemIds
  //       return bodyCartItemIds.every((cartItemId) => {
  //         // Neu đã đến bước này thì cartItem luôn luôn có giá trị
  //         // Vì chúng ta đã so sánh với allBodyCartItems.length ở trên rồi
  //         const cartItem = cartItemMap.get(cartItemId)!
  //         return item.shopId === cartItem.sku.createdById
  //       })
  //     })
  //     if (!isValidShop) {
  //       throw SKUNotBelongToShopException
  //     }

  //     // 5. Tạo order và xóa cartItem trong transaction để đảm bảo tính toàn vẹn dữ liệu

  //     const payment = await tx.payment.create({
  //       data: {
  //         status: PaymentStatus.PENDING,
  //       },
  //     })
  //     const orders$ = Promise.all(
  //       body.map((item) =>
  //         tx.order.create({
  //           data: {
  //             userId,
  //             status: OrderStatus.PENDING_PAYMENT,
  //             receiver: item.receiver,
  //             createdById: userId,
  //             shopId: item.shopId,
  //             paymentId: payment.id,
  //             items: {
  //               create: item.cartItemIds.map((cartItemId) => {
  //                 const cartItem = cartItemMap.get(cartItemId)!
  //                 return {
  //                   productName: cartItem.sku.product.name,
  //                   skuPrice: cartItem.sku.price,
  //                   image: cartItem.sku.image,
  //                   skuId: cartItem.sku.id,
  //                   skuValue: cartItem.sku.value,
  //                   quantity: cartItem.quantity,
  //                   productId: cartItem.sku.product.id,
  //                   productTranslations: cartItem.sku.product.productTranslations.map((translation) => {
  //                     return {
  //                       id: translation.id,
  //                       name: translation.name,
  //                       description: translation.description,
  //                       languageId: translation.languageId,
  //                     }
  //                   }),
  //                 }
  //               }),
  //             },
  //             products: {
  //               connect: item.cartItemIds.map((cartItemId) => {
  //                 const cartItem = cartItemMap.get(cartItemId)!
  //                 return {
  //                   id: cartItem.sku.product.id,
  //                 }
  //               }),
  //             },
  //           },
  //         }),
  //       ),
  //     )
  //     const cartItem$ = tx.cartItem.deleteMany({
  //       where: {
  //         id: {
  //           in: allBodyCartItemIds,
  //         },
  //       },
  //     })
  //     const sku$ = Promise.all(
  //       cartItems.map((item) =>
  //         tx.sKU.update({
  //           where: {
  //             id: item.sku.id,
  //           },
  //           data: {
  //             stock: {
  //               decrement: item.quantity,
  //             },
  //           },
  //         }),
  //       ),
  //     )
  //     const [orders] = await Promise.all([orders$, cartItem$, sku$])

  //     const totalPrice = cartItems.reduce((total, item) => total + item.sku.price * item.quantity, 0)

  //     await this.orderProducer.cancelPaymentJob(payment.id)

  //     const paymentQR = createPaymentVietQR({
  //       amount: totalPrice,
  //       content: `DH${payment.id}`,
  //     })
  //     return [payment, orders, paymentQR]
  //   })
  //   return {
  //     paymentId: payment.id,
  //     paymentQR,
  //     orders: orders as any,
  //   }
  // }

  // ## Using Optimistic Locking to prevent race conditions when creating orders
  // async create(
  //   userId: number,
  //   body: CreateOrderBodyType,
  // ): Promise<{
  //   paymentId: number
  //   paymentQR: string
  //   orders: CreateOrderResType['data']
  // }> {
  //   // 1. Kiểm tra xem tất cả cartItemIds có tồn tại trong cơ sở dữ liệu hay không
  //   // 2. Kiểm tra số lượng mua có lớn hơn số lượng tồn kho hay không
  //   // 3. Kiểm tra xem tất cả sản phẩm mua có sản phẩm nào bị xóa hay ẩn không
  //   // 4. Kiểm tra xem các skuId trong cartItem gửi lên có thuộc về shopid gửi lên không
  //   // 5. Tạo order
  //   // 6. Xóa cartItem

  //   const allBodyCartItemIds = body.map((item) => item.cartItemIds).flat()

  //   const [paymentId, orders, paymentQR] = await this.prisma
  //     .$transaction<[number, CreateOrderResType['data'], string]>(async (tx) => {
  //       const cartItems = await tx.cartItem.findMany({
  //         where: {
  //           id: {
  //             in: allBodyCartItemIds,
  //           },
  //           userId,
  //         },
  //         include: {
  //           sku: {
  //             include: {
  //               product: {
  //                 include: {
  //                   productTranslations: true,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       })

  //       // 1. Kiểm tra xem tất cả cartItemIds có tồn tại trong cơ sở dữ liệu hay không
  //       if (cartItems.length !== allBodyCartItemIds.length) {
  //         throw NotFoundCartItemException
  //       }

  //       // 2. Kiểm tra số lượng mua có lớn hơn số lượng tồn kho hay không
  //       const isOutOfStock = cartItems.some((item) => {
  //         return item.sku.stock < item.quantity
  //       })
  //       if (isOutOfStock) {
  //         throw OutOfStockSKUException
  //       }

  //       // 3. Kiểm tra xem tất cả sản phẩm mua có sản phẩm nào bị xóa hay ẩn không
  //       const isExistNotReadyProduct = cartItems.some(
  //         (item) =>
  //           item.sku.product.deletedAt !== null ||
  //           item.sku.product.publishedAt === null ||
  //           item.sku.product.publishedAt > new Date(),
  //       )
  //       if (isExistNotReadyProduct) {
  //         throw ProductNotFoundException
  //       }

  //       // 4. Kiểm tra xem các skuId trong cartItem gửi lên có thuộc về shopid gửi lên không
  //       const cartItemMap = new Map<number, (typeof cartItems)[0]>()
  //       cartItems.forEach((item) => {
  //         cartItemMap.set(item.id, item)
  //       })
  //       const isValidShop = body.every((item) => {
  //         const bodyCartItemIds = item.cartItemIds
  //         return bodyCartItemIds.every((cartItemId) => {
  //           // Neu đã đến bước này thì cartItem luôn luôn có giá trị
  //           // Vì chúng ta đã so sánh với allBodyCartItems.length ở trên rồi
  //           const cartItem = cartItemMap.get(cartItemId)!
  //           return item.shopId === cartItem.sku.createdById
  //         })
  //       })
  //       if (!isValidShop) {
  //         throw SKUNotBelongToShopException
  //       }

  //       // 5. Tạo order và xóa cartItem trong transaction để đảm bảo tính toàn vẹn dữ liệu

  //       const payment = await tx.payment.create({
  //         data: {
  //           status: PaymentStatus.PENDING,
  //         },
  //       })

  //       const orders: CreateOrderResType['data'] = []

  //       for (const item of body) {
  //         const order = await tx.order
  //           .create({
  //             data: {
  //               userId,
  //               status: OrderStatus.PENDING_PAYMENT,
  //               receiver: item.receiver,
  //               createdById: userId,
  //               shopId: item.shopId,
  //               paymentId: payment.id,
  //               items: {
  //                 create: item.cartItemIds.map((cartItemId) => {
  //                   const cartItem = cartItemMap.get(cartItemId)!
  //                   return {
  //                     productName: cartItem.sku.product.name,
  //                     skuPrice: cartItem.sku.price,
  //                     image: cartItem.sku.image,
  //                     skuId: cartItem.sku.id,
  //                     skuValue: cartItem.sku.value,
  //                     quantity: cartItem.quantity,
  //                     productId: cartItem.sku.product.id,
  //                     productTranslations: cartItem.sku.product.productTranslations.map((translation) => {
  //                       return {
  //                         id: translation.id,
  //                         name: translation.name,
  //                         description: translation.description,
  //                         languageId: translation.languageId,
  //                       }
  //                     }),
  //                   }
  //                 }),
  //               },
  //               products: {
  //                 connect: item.cartItemIds.map((cartItemId) => {
  //                   const cartItem = cartItemMap.get(cartItemId)!
  //                   return {
  //                     id: cartItem.sku.product.id,
  //                   }
  //                 }),
  //               },
  //             },
  //           })
  //           .catch((e) => {
  //             console.log('order:', e)
  //             throw e
  //           })
  //         orders.push(order as any)
  //       }

  //       await tx.cartItem
  //         .deleteMany({
  //           where: {
  //             id: {
  //               in: allBodyCartItemIds,
  //             },
  //           },
  //         })
  //         .catch((e) => {
  //           console.log('cartItem:', e)
  //           throw e
  //         })

  //       for (const item of cartItems) {
  //         await tx.sKU
  //           .update({
  //             where: {
  //               id: item.sku.id,
  //               updatedAt: item.sku.updatedAt, // Đảm bảo không có ai khác đã cập nhật SKU này trong khi chúng ta đang xử lý
  //               stock: {
  //                 gte: item.quantity, // Đảm bảo rằng stock vẫn còn đủ để giảm
  //               },
  //             },
  //             data: {
  //               stock: {
  //                 decrement: item.quantity,
  //               },
  //             },
  //           })
  //           .catch((e) => {
  //             console.log('sku:', e)
  //             if (isNotFoundPrismaError(e)) {
  //               throw VersionConflictException
  //             }
  //             throw e
  //           })
  //       }

  //       // const [orders] = await Promise.all([orders$, cartItem$, sku$])

  //       const totalPrice = cartItems.reduce((total, item) => total + item.sku.price * item.quantity, 0)

  //       await this.orderProducer.cancelPaymentJob(payment.id)

  //       const paymentQR = createPaymentVietQR({
  //         amount: totalPrice,
  //         content: `DH${payment.id}`,
  //       })
  //       return [payment.id, orders as any, paymentQR]
  //     })
  //     .catch((error) => {
  //       console.log(error)
  //       throw error
  //     })
  //   return {
  //     paymentId,
  //     paymentQR,
  //     orders: orders as any,
  //   }
  // }

  // ## Using RedLock
  async create(
    userId: number,
    body: CreateOrderBodyType,
  ): Promise<{
    paymentId: number
    paymentQR: string
    orders: CreateOrderResType['data']
  }> {
    // 1. Kiểm tra xem tất cả cartItemIds có tồn tại trong cơ sở dữ liệu hay không
    // 2. Kiểm tra số lượng mua có lớn hơn số lượng tồn kho hay không
    // 3. Kiểm tra xem tất cả sản phẩm mua có sản phẩm nào bị xóa hay ẩn không
    // 4. Kiểm tra xem các skuId trong cartItem gửi lên có thuộc về shopid gửi lên không
    // 5. Tạo order
    // 6. Xóa cartItem

    const allBodyCartItemIds = body.map((item) => item.cartItemIds).flat()

    const cartItemsForSKUId = await this.prisma.cartItem.findMany({
      where: {
        id: {
          in: allBodyCartItemIds,
        },
        userId,
      },
      select: {
        skuId: true,
      },
    })
    const skuIds = cartItemsForSKUId.map((cartItem) => cartItem.skuId)

    // Lock tất cả các SKU cần mua
    const locks = await Promise.all(
      skuIds.map((skuId) => {
        return redlock.acquire([`locks:sku:${skuId}`], 3000) // Khóa trong 3 giây
      }),
    ).catch((error) => {
      throw ServerOverloadException
    })

    try {
      const [paymentId, orders, paymentQR] = await this.prisma
        .$transaction<[number, CreateOrderResType['data'], string]>(async (tx) => {
          // await tx.$queryRaw`SELECT * FROM "SKU" WHERE id IN (${Prisma.join(skuIds)}) FOR UPDATE`
          const cartItems = await tx.cartItem.findMany({
            where: {
              id: {
                in: allBodyCartItemIds,
              },
              userId,
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

          // 1. Kiểm tra xem tất cả cartItemIds có tồn tại trong cơ sở dữ liệu hay không
          if (cartItems.length !== allBodyCartItemIds.length) {
            throw NotFoundCartItemException
          }

          // 2. Kiểm tra số lượng mua có lớn hơn số lượng tồn kho hay không
          const isOutOfStock = cartItems.some((item) => {
            return item.sku.stock < item.quantity
          })
          if (isOutOfStock) {
            throw OutOfStockSKUException
          }

          // 3. Kiểm tra xem tất cả sản phẩm mua có sản phẩm nào bị xóa hay ẩn không
          const isExistNotReadyProduct = cartItems.some(
            (item) =>
              item.sku.product.deletedAt !== null ||
              item.sku.product.publishedAt === null ||
              item.sku.product.publishedAt > new Date(),
          )
          if (isExistNotReadyProduct) {
            throw ProductNotFoundException
          }

          // 4. Kiểm tra xem các skuId trong cartItem gửi lên có thuộc về shopid gửi lên không
          const cartItemMap = new Map<number, (typeof cartItems)[0]>()
          cartItems.forEach((item) => {
            cartItemMap.set(item.id, item)
          })
          const isValidShop = body.every((item) => {
            const bodyCartItemIds = item.cartItemIds
            return bodyCartItemIds.every((cartItemId) => {
              // Neu đã đến bước này thì cartItem luôn luôn có giá trị
              // Vì chúng ta đã so sánh với allBodyCartItems.length ở trên rồi
              const cartItem = cartItemMap.get(cartItemId)!
              return item.shopId === cartItem.sku.createdById
            })
          })
          if (!isValidShop) {
            throw SKUNotBelongToShopException
          }

          // 5. Tạo order và xóa cartItem trong transaction để đảm bảo tính toàn vẹn dữ liệu

          const payment = await tx.payment.create({
            data: {
              status: PaymentStatus.PENDING,
            },
          })

          const orders: CreateOrderResType['data'] = []

          for (const item of body) {
            const order = await tx.order
              .create({
                data: {
                  userId,
                  status: OrderStatus.PENDING_PAYMENT,
                  receiver: item.receiver,
                  createdById: userId,
                  shopId: item.shopId,
                  paymentId: payment.id,
                  items: {
                    create: item.cartItemIds.map((cartItemId) => {
                      const cartItem = cartItemMap.get(cartItemId)!
                      return {
                        productName: cartItem.sku.product.name,
                        skuPrice: cartItem.sku.price,
                        image: cartItem.sku.image,
                        skuId: cartItem.sku.id,
                        skuValue: cartItem.sku.value,
                        quantity: cartItem.quantity,
                        productId: cartItem.sku.product.id,
                        productTranslations: cartItem.sku.product.productTranslations.map((translation) => {
                          return {
                            id: translation.id,
                            name: translation.name,
                            description: translation.description,
                            languageId: translation.languageId,
                          }
                        }),
                      }
                    }),
                  },
                  products: {
                    connect: item.cartItemIds.map((cartItemId) => {
                      const cartItem = cartItemMap.get(cartItemId)!
                      return {
                        id: cartItem.sku.product.id,
                      }
                    }),
                  },
                },
              })
              .catch((e) => {
                console.log('order:', e)
                throw e
              })
            orders.push(order as any)
          }

          await tx.cartItem
            .deleteMany({
              where: {
                id: {
                  in: allBodyCartItemIds,
                },
              },
            })
            .catch((e) => {
              console.log('cartItem:', e)
              throw e
            })

          for (const item of cartItems) {
            await tx.sKU.update({
              where: {
                id: item.sku.id,
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            })
          }

          // const [orders] = await Promise.all([orders$, cartItem$, sku$])

          const totalPrice = cartItems.reduce((total, item) => total + item.sku.price * item.quantity, 0)

          await this.orderProducer.cancelPaymentJob(payment.id)

          const paymentQR = createPaymentVietQR({
            amount: totalPrice,
            content: `DH${payment.id}`,
          })
          return [payment.id, orders as any, paymentQR]
        })
        .catch((error) => {
          console.log(error)
          throw error
        })
      return {
        paymentId,
        paymentQR,
        orders: orders as any,
      }
    } finally {
      // Giải phóng tất cả các lock
      await Promise.all(locks.map((lock) => lock.release().catch(() => {}))) // Bỏ qua lỗi khi giải phóng lock
    }
  }
  async detail(userId: number, orderId: number): Promise<GetOrderDetailResType> {
    const order = await this.prisma.order.findUnique({
      where: {
        userId,
        id: orderId,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    })
    if (!order) {
      throw OrderNotFoundException
    }
    return order as any
  }

  async cancel(userId: number, orderId: number): Promise<CancelOrderResType> {
    try {
      const order = await this.prisma.order.findUniqueOrThrow({
        where: {
          userId,
          id: orderId,
        },
      })

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw CannotCancelOrderException
      }

      const updatedOrder = await this.prisma.order.update({
        where: {
          userId,
          id: orderId,
          deletedAt: null,
        },
        data: {
          status: OrderStatus.CANCELLED,
          updatedById: userId,
        },
      })
      return updatedOrder as any
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw OrderNotFoundException
      }
      throw error
    }
  }
}
