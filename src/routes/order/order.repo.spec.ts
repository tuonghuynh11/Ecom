import { Test, TestingModule } from '@nestjs/testing'
import { OrderStatus, PaymentStatus } from 'src/generated/prisma/enums'
import { OrderProducer } from 'src/routes/order/order.producer'
import { OrderRepo } from 'src/routes/order/order.repo'
import { createPaymentVietQR } from 'src/shared/helpers'
import { redlock } from 'src/shared/redis'
import { PrismaService } from 'src/shared/services/prisma.service'

jest.mock('src/shared/helpers', () => ({
  ...jest.requireActual('src/shared/helpers'),
  createPaymentVietQR: jest.fn(),
}))
const mockCreatePaymentVietQR = jest.mocked(createPaymentVietQR)

jest.mock('uuid', () => ({
  __esModule: true,
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}))

jest.mock('src/shared/redis', () => {
  return {
    redlock: {
      acquire: jest.fn(),
    },
  }
})

const mockLock = {
  release: jest.fn().mockResolvedValue({}),
}

describe('OrderRepo', () => {
  let orderRepo: OrderRepo
  const mockPrismaService = {
    $transaction: jest.fn(),
    cartItem: {
      findMany: jest.fn(),
    },
  }

  const mockOrderProducer = {
    cancelPaymentJob: jest.fn(),
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRepo,

        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OrderProducer,
          useValue: mockOrderProducer,
        },
      ],
    }).compile()

    orderRepo = app.get<OrderRepo>(OrderRepo)
    ;(redlock.acquire as jest.Mock).mockResolvedValue(mockLock)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    const userId = 1
    const createOrderBody = [
      {
        shopId: 1,
        cartItemIds: [1, 2],
        receiver: {
          name: 'John Doe',
          phone: '1234567890',
          address: '123 Main St',
        },
      },
    ]

    const mockCartItemsForSKUId: { skuId: string }[] = [{ skuId: '1' }, { skuId: '2' }]
    const mockCartItems = [
      {
        id: 1,
        skuId: 1,
        quantity: 2,
        userId: 1,
        sku: {
          id: 1,
          stock: 10,
          price: 100000,
          image: 'image1.jpg',
          value: 'Red-M',
          createdById: 1,
          updatedAt: new Date('2024-01-01'),
          product: {
            id: 1,
            name: 'Product 1',
            deletedAt: null,
            publishedAt: new Date('2024-01-01'),
            productTranslations: [
              {
                id: 1,
                name: 'Product 1',
                description: 'Description 1',
                languageId: 1,
              },
            ],
          },
        },
      },
      {
        id: 2,
        skuId: 2,
        quantity: 1,
        userId: 1,
        sku: {
          id: 2,
          stock: 5,
          price: 200000,
          image: 'image2.jpg',
          value: 'Blue-L',
          createdById: 1,
          updatedAt: new Date('2024-01-01'),
          product: {
            id: 2,
            name: 'Product 2',
            deletedAt: null,
            publishedAt: new Date('2024-01-01'),
            productTranslations: [
              {
                id: 2,
                name: 'Product 2',
                description: 'Description 2',
                languageId: 1,
              },
            ],
          },
        },
      },
    ]

    const mockPaymentCreated = {
      id: 1,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockOrderCreated = {
      id: 1,
      userId: 1,
      status: OrderStatus.PENDING_PAYMENT,
      shopId: 1,
      paymentId: 1,
    }

    it('should create order successfully', async () => {
      const mockPaymentLink = 'https://vietqr.app/img?bank=MB&acc=0123456789&amount=400000&des=DH1&template=compact'
      mockCreatePaymentVietQR.mockReturnValue(mockPaymentLink)

      mockPrismaService.cartItem.findMany.mockResolvedValue(mockCartItemsForSKUId)

      // Mock Transaction Callback

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          cartItem: {
            findMany: jest.fn().mockResolvedValue(mockCartItems),
            deleteMany: jest.fn().mockResolvedValue({ count: mockCartItems.length }),
          },
          payment: {
            create: jest.fn().mockResolvedValue(mockPaymentCreated),
          },
          order: {
            create: jest.fn().mockResolvedValue(mockOrderCreated),
          },
          sKU: {
            update: jest.fn().mockResolvedValue({}),
          },
        }

        return await callback(tx)
      })
      mockOrderProducer.cancelPaymentJob.mockResolvedValue(undefined)

      const order = await orderRepo.create(userId, createOrderBody)

      expect(order).toEqual({
        paymentId: mockPaymentCreated.id,
        paymentQR: mockPaymentLink,
        orders: [mockOrderCreated],
      })

      expect(mockOrderProducer.cancelPaymentJob).toHaveBeenCalledWith(mockPaymentCreated.id)

      expect(redlock.acquire).toHaveBeenCalledTimes(mockCartItemsForSKUId.length)
      expect(mockLock.release).toHaveBeenCalledTimes(mockCartItemsForSKUId.length)
    })
  })
})
