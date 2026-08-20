import { Injectable } from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import {
  CategoryType,
  CreateCategoryBodyType,
  GetAllCategoriesIncludeNestedResType,
  UpdateCategoryBodyType,
} from 'src/routes/category/category.model'
import { CategoryRepo } from 'src/routes/category/category.repo'
import { NotFoundRecordException } from 'src/shared/error'
import { isNotFoundPrismaError } from 'src/shared/helpers'

@Injectable()
export class CategoryService {
  constructor(private categoryRepo: CategoryRepo) {}

  findAll(parentCategoryId?: number | null) {
    return this.categoryRepo.findAll({
      parentCategoryId,
      languageId: I18nContext.current()?.lang as string,
    })
  }
  buildNestedCategories(categories: CategoryType[], parentId: number | null): GetAllCategoriesIncludeNestedResType {
    return categories
      .filter((category) => category.parentCategoryId === parentId)
      .map((category: CategoryType) => ({
        ...category,
        childrenCategories: this.buildNestedCategories(categories, category.id),
      }))
  }
  async findAllIncludeNested() {
    const categories = await this.categoryRepo.findAllNotCondition({
      languageId: I18nContext.current()?.lang as string,
    })

    const result = this.buildNestedCategories(categories.data, null)
    console.log('result:', result)
    return result
  }
  async findById(id: number) {
    const category = await this.categoryRepo.findById({
      id,
      languageId: I18nContext.current()?.lang as string,
    })
    if (!category) {
      throw NotFoundRecordException
    }
    return category
  }

  create({ data, createdById }: { data: CreateCategoryBodyType; createdById: number }) {
    return this.categoryRepo.create({
      createdById,
      data,
    })
  }

  async update({ id, data, updatedById }: { id: number; data: UpdateCategoryBodyType; updatedById: number }) {
    try {
      const category = await this.categoryRepo.update({
        id,
        updatedById,
        data,
      })
      return category
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.categoryRepo.delete({
        id,
        deletedById,
      })
      return {
        message: 'Delete successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}
