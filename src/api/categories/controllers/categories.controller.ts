import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dtos/request/create-category.dto';
import { UpdateCategoryDto } from '../dtos/request/update-category.dto';
import {
  CategoryIdParamDTO,
  GetSubcategoriesParamDTO,
  SearchCategoriesQueryDTO,
  ChangeCategoryStatusQueryDTO,
} from '../dtos/request';
import {
  CategoryDetailResponseDTO,
  CategoryStatsResponseDTO,
} from '../dtos/response';
import {
  ApiCreateCategory,
  ApiGetAllCategories,
  ApiGetAllCategoriesWithRelations,
  ApiGetMainCategories,
  ApiGetSubcategories,
  ApiSearchCategories,
  ApiGetCategoryById,
  ApiGetCategoryBySlug,
  ApiGetCategoryStats,
  ApiUpdateCategory,
  ApiChangeCategoryStatus,
  ApiToggleCategoryVisibility,
  ApiDeleteCategory,
} from '../docs/categories.docs';

@ApiTags('Categorías')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreateCategory()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryDetailResponseDTO> {
    return this.categoriesService.create(
      createCategoryDto,
    ) as unknown as Promise<CategoryDetailResponseDTO>;
  }

  @Get()
  @ApiGetAllCategories()
  async findAll(): Promise<CategoryDetailResponseDTO[]> {
    return this.categoriesService.findAll() as unknown as Promise<
      CategoryDetailResponseDTO[]
    >;
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiGetAllCategoriesWithRelations()
  async findAllWithRelations(): Promise<CategoryDetailResponseDTO[]> {
    return this.categoriesService.findAllWithRelations() as unknown as Promise<
      CategoryDetailResponseDTO[]
    >;
  }

  @Get('main')
  @ApiGetMainCategories()
  async findMainCategories(): Promise<CategoryDetailResponseDTO[]> {
    return this.categoriesService.findMainCategories() as unknown as Promise<
      CategoryDetailResponseDTO[]
    >;
  }

  @Get('subcategories/:parentId')
  @ApiGetSubcategories()
  async findSubcategories(
    @Param() param: GetSubcategoriesParamDTO,
  ): Promise<CategoryDetailResponseDTO[]> {
    return this.categoriesService.findSubcategories(
      param.parentId,
    ) as unknown as Promise<CategoryDetailResponseDTO[]>;
  }

  @Get('search')
  @ApiSearchCategories()
  async searchCategories(
    @Query() query: SearchCategoriesQueryDTO,
  ): Promise<CategoryDetailResponseDTO[]> {
    return this.categoriesService.searchCategories(
      query.q,
    ) as unknown as Promise<CategoryDetailResponseDTO[]>;
  }

  @Get(':id')
  @ApiGetCategoryById()
  async findOne(
    @Param() param: CategoryIdParamDTO,
  ): Promise<CategoryDetailResponseDTO> {
    return this.categoriesService.findOne(
      param.id,
    ) as unknown as Promise<CategoryDetailResponseDTO>;
  }

  @Get('slug/:slug')
  @ApiGetCategoryBySlug()
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<CategoryDetailResponseDTO> {
    return this.categoriesService.findBySlug(
      slug,
    ) as unknown as Promise<CategoryDetailResponseDTO>;
  }

  @Get(':id/stats')
  @ApiGetCategoryStats()
  async getCategoryStats(
    @Param() param: CategoryIdParamDTO,
  ): Promise<CategoryStatsResponseDTO> {
    return this.categoriesService.getCategoryStats(param.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateCategory()
  async update(
    @Param() param: CategoryIdParamDTO,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDetailResponseDTO> {
    return this.categoriesService.update(
      param.id,
      updateCategoryDto,
    ) as unknown as Promise<CategoryDetailResponseDTO>;
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiChangeCategoryStatus()
  async changeStatus(
    @Param() param: CategoryIdParamDTO,
    @Query() query: ChangeCategoryStatusQueryDTO,
  ): Promise<CategoryDetailResponseDTO> {
    return this.categoriesService.changeStatus(
      param.id,
      query.status,
    ) as unknown as Promise<CategoryDetailResponseDTO>;
  }

  @Patch(':id/toggle-visibility')
  @UseGuards(JwtAuthGuard)
  @ApiToggleCategoryVisibility()
  async toggleVisibility(
    @Param() param: CategoryIdParamDTO,
  ): Promise<CategoryDetailResponseDTO> {
    return this.categoriesService.toggleVisibility(
      param.id,
    ) as unknown as Promise<CategoryDetailResponseDTO>;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteCategory()
  async remove(@Param() param: CategoryIdParamDTO): Promise<void> {
    return this.categoriesService.remove(param.id);
  }
}
