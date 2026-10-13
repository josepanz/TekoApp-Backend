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
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt-auth.guard';
import { User } from '@common/decorators/user.decorator';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { PaginationQueryDTO } from '@common/dtos/pagination.dto';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.CATEGORIES.MANAGE, PERMISSIONS.ADMIN.ALL)
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.CATEGORIES.MANAGE, PERMISSIONS.ADMIN.ALL)
  @ApiGetAllCategoriesWithRelations()
  async findAllWithRelations(
    @Query() query: PaginationQueryDTO,
  ): Promise<PaginatedResponse<CategoryDetailResponseDTO>> {
    return this.categoriesService.findAllWithRelations(
      query.page,
      query.pageSize,
    ) as unknown as Promise<PaginatedResponse<CategoryDetailResponseDTO>>;
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
  @UseGuards(OptionalJwtAuthGuard)
  @ApiGetCategoryById()
  async findOne(
    @Param() param: CategoryIdParamDTO,
    @User() user?: IUserDataOnJwt,
  ): Promise<CategoryDetailResponseDTO> {
    // DEF-BE-008: las categorías ocultas/inactivas solo las ve quien puede administrarlas.
    const canSeeHidden =
      user?.permissions?.some(
        (p) =>
          p === PERMISSIONS.CATEGORIES.MANAGE || p === PERMISSIONS.ADMIN.ALL,
      ) ?? false;
    return this.categoriesService.findOneForViewer(
      param.id,
      canSeeHidden,
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.CATEGORIES.MANAGE, PERMISSIONS.ADMIN.ALL)
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.CATEGORIES.MANAGE, PERMISSIONS.ADMIN.ALL)
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.CATEGORIES.MANAGE, PERMISSIONS.ADMIN.ALL)
  @ApiToggleCategoryVisibility()
  async toggleVisibility(
    @Param() param: CategoryIdParamDTO,
  ): Promise<CategoryDetailResponseDTO> {
    return this.categoriesService.toggleVisibility(
      param.id,
    ) as unknown as Promise<CategoryDetailResponseDTO>;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.CATEGORIES.MANAGE, PERMISSIONS.ADMIN.ALL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteCategory()
  async remove(@Param() param: CategoryIdParamDTO): Promise<void> {
    return this.categoriesService.remove(param.id);
  }
}
