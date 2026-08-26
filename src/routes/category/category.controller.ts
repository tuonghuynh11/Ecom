import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import {
  CreateCategoryBodyDTO,
  GetAllCategoriesIncludeNestedResDTO,
  GetAllCategoriesQueryDTO,
  GetAllCategoriesResDTO,
  GetCategoryDetailResDTO,
  GetCategoryParamsDTO,
  UpdateCategoryBodyDTO,
} from 'src/routes/category/category.dto'
import { CategoryService } from 'src/routes/category/category.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { MessageResDto } from 'src/shared/dtos/response.dto'

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @IsPublic()
  @ApiQuery({ name: 'parentCategoryId', type: Number, required: false })
  @ZodResponse({ type: GetAllCategoriesResDTO })
  findAll(@Query() query: GetAllCategoriesQueryDTO) {
    return this.categoryService.findAll(query.parentCategoryId)
  }
  @Get('nested')
  @IsPublic()
  @ZodResponse({ type: GetAllCategoriesIncludeNestedResDTO })
  findAllIncludeNested() {
    return this.categoryService.findAllIncludeNested()
  }

  @Get(':categoryId')
  @IsPublic()
  @ApiParam({ name: 'categoryId', type: Number })
  @ZodResponse({ type: GetCategoryDetailResDTO })
  findById(@Param() params: GetCategoryParamsDTO) {
    return this.categoryService.findById(params.categoryId)
  }

  @Post()
  @ApiBearerAuth()
  @ZodResponse({ type: GetCategoryDetailResDTO })
  create(@Body() body: CreateCategoryBodyDTO, @ActiveUser('userId') userId: number) {
    return this.categoryService.create({
      data: body,
      createdById: userId,
    })
  }

  @Put(':categoryId')
  @ApiBearerAuth()
  @ApiParam({ name: 'categoryId', type: Number })
  @ZodResponse({ type: GetCategoryDetailResDTO })
  update(
    @Body() body: UpdateCategoryBodyDTO,
    @Param() params: GetCategoryParamsDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.categoryService.update({
      data: body,
      id: params.categoryId,
      updatedById: userId,
    })
  }

  @Delete(':categoryId')
  @ApiBearerAuth()
  @ApiParam({ name: 'categoryId', type: Number })
  @ZodResponse({ type: MessageResDto })
  delete(@Param() params: GetCategoryParamsDTO, @ActiveUser('userId') userId: number) {
    return this.categoryService.delete({
      id: params.categoryId,
      deletedById: userId,
    })
  }
}
