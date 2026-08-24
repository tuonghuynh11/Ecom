import { Injectable } from '@nestjs/common'
import { OrderWhereInput } from 'src/generated/prisma/models'
import { GetOrderListQueryType, GetOrderListResType } from 'src/routes/order/order.model'
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
}
