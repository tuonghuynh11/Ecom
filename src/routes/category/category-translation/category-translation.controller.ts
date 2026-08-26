import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import {
  CreateCategoryTranslationBodyDTO,
  GetCategoryTranslationDetailResDTO,
  GetCategoryTranslationParamsDTO,
  UpdateCategoryTranslationBodyDTO,
} from 'src/routes/category/category-translation/category-translation.dto'
import { CategoryTranslationService } from 'src/routes/category/category-translation/category-translation.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDto } from 'src/shared/dtos/response.dto'

@Controller('category-translations')
@ApiBearerAuth()
export class CategoryTranslationController {
  constructor(private readonly categoryTranslationService: CategoryTranslationService) {}

  @Get(':categoryTranslationId')
  @ApiParam({ name: 'categoryTranslationId', type: Number })
  @ZodResponse({ type: GetCategoryTranslationDetailResDTO })
  findById(@Param() params: GetCategoryTranslationParamsDTO) {
    return this.categoryTranslationService.findById(params.categoryTranslationId)
  }

  @Post()
  @ZodResponse({ type: GetCategoryTranslationDetailResDTO })
  create(@Body() body: CreateCategoryTranslationBodyDTO, @ActiveUser('userId') userId: number) {
    return this.categoryTranslationService.create({
      data: body,
      createdById: userId,
    })
  }

  @Put(':categoryTranslationId')
  @ApiParam({ name: 'categoryTranslationId', type: Number })
  @ZodResponse({ type: GetCategoryTranslationDetailResDTO })
  update(
    @Body() body: UpdateCategoryTranslationBodyDTO,
    @Param() params: GetCategoryTranslationParamsDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.categoryTranslationService.update({
      data: body,
      id: params.categoryTranslationId,
      updatedById: userId,
    })
  }

  @Delete(':categoryTranslationId')
  @ApiParam({ name: 'categoryTranslationId', type: Number })
  @ZodResponse({ type: MessageResDto })
  delete(@Param() params: GetCategoryTranslationParamsDTO, @ActiveUser('userId') userId: number) {
    return this.categoryTranslationService.delete({
      id: params.categoryTranslationId,
      deletedById: userId,
    })
  }
}
