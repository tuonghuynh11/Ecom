/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable } from '@nestjs/common'
import {
  CategoryIncludeTranslationType,
  CategoryType,
  CreateCategoryBodyType,
  GetAllCategoriesResType,
  UpdateCategoryBodyType,
} from 'src/routes/category/category.model'
import { ALL_LANGUAGES_CODE } from 'src/shared/constants/other.constant'
import { SerializeAll } from 'src/shared/decorators/serialize.decorator'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
@SerializeAll()
export class CategoryRepo {
  constructor(private prismaService: PrismaService) {}

  async findAll({
    parentCategoryId,
    languageId,
  }: {
    parentCategoryId?: number | null
    languageId: string
  }): Promise<GetAllCategoriesResType> {
    const categories = (await this.prismaService.category.findMany({
      where: {
        deletedAt: null,
        parentCategoryId: parentCategoryId ?? null,
      },
      include: {
        categoryTranslations: {
          where: languageId === ALL_LANGUAGES_CODE ? { deletedAt: null } : { deletedAt: null, languageId },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })) as any

    return {
      data: categories,
      totalItems: categories.length,
    }
  }

  async findAllNotCondition({ languageId }: { languageId: string }): Promise<GetAllCategoriesResType> {
    const categories = (await this.prismaService.category.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        categoryTranslations: {
          where: languageId === ALL_LANGUAGES_CODE ? { deletedAt: null } : { deletedAt: null, languageId },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })) as any

    return {
      data: categories,
      totalItems: categories.length,
    }
  }

  findById({ id, languageId }: { id: number; languageId: string }): Promise<CategoryIncludeTranslationType | null> {
    return this.prismaService.category.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        categoryTranslations: {
          where: languageId === ALL_LANGUAGES_CODE ? { deletedAt: null } : { deletedAt: null, languageId },
        },
      },
    }) as any
  }

  create({
    createdById,
    data,
  }: {
    createdById: number | null
    data: CreateCategoryBodyType
  }): Promise<CategoryIncludeTranslationType> {
    return this.prismaService.category.create({
      data: {
        ...data,
        createdById,
      },
      include: {
        categoryTranslations: {
          where: { deletedAt: null },
        },
      },
    }) as any
  }

  update({
    id,
    updatedById,
    data,
  }: {
    id: number
    updatedById: number
    data: UpdateCategoryBodyType
  }): Promise<CategoryIncludeTranslationType> {
    return this.prismaService.category.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        ...data,
        updatedById,
      },
      include: {
        categoryTranslations: {
          where: { deletedAt: null },
        },
      },
    }) as any
  }

  delete(
    {
      id,
      deletedById,
    }: {
      id: number
      deletedById: number
    },
    isHard?: boolean,
  ): Promise<CategoryType> {
    return isHard
      ? (this.prismaService.category.delete({
          where: {
            id,
          },
        }) as any)
      : (this.prismaService.category.update({
          where: {
            id,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            deletedById,
          },
        }) as any)
  }
}
