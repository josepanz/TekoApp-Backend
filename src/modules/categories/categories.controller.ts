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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@ApiTags('Categorías')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear nueva categoría',
    description: 'Crea una nueva categoría de servicios profesionales',
  })
  @ApiResponse({
    status: 201,
    description: 'Categoría creada exitosamente',
    type: Category,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una categoría con este nombre',
  })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las categorías',
    description: 'Retorna todas las categorías activas y visibles',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías',
    type: [Category],
  })
  async findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener todas las categorías (incluyendo inactivas)',
    description: 'Retorna todas las categorías con sus relaciones para administradores',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista completa de categorías',
    type: [Category],
  })
  async findAllWithRelations(): Promise<Category[]> {
    return this.categoriesService.findAllWithRelations();
  }

  @Get('main')
  @ApiOperation({
    summary: 'Obtener categorías principales',
    description: 'Retorna solo las categorías principales (sin subcategorías)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías principales',
    type: [Category],
  })
  async findMainCategories(): Promise<Category[]> {
    return this.categoriesService.findMainCategories();
  }

  @Get('subcategories/:parentId')
  @ApiParam({ name: 'parentId', description: 'ID de la categoría padre' })
  @ApiOperation({
    summary: 'Obtener subcategorías',
    description: 'Retorna las subcategorías de una categoría específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de subcategorías',
    type: [Category],
  })
  async findSubcategories(@Param('parentId') parentId: string): Promise<Category[]> {
    return this.categoriesService.findSubcategories(parentId);
  }

  @Get('search')
  @ApiQuery({ name: 'q', description: 'Término de búsqueda' })
  @ApiOperation({
    summary: 'Buscar categorías',
    description: 'Busca categorías por nombre o descripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados de la búsqueda',
    type: [Category],
  })
  async searchCategories(@Query('q') query: string): Promise<Category[]> {
    return this.categoriesService.searchCategories(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiOperation({
    summary: 'Obtener categoría por ID',
    description: 'Retorna una categoría específica por su ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría encontrada',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'Categoría no encontrada',
  })
  async findOne(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiParam({ name: 'slug', description: 'Slug de la categoría' })
  @ApiOperation({
    summary: 'Obtener categoría por slug',
    description: 'Retorna una categoría específica por su slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría encontrada',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'Categoría no encontrada',
  })
  async findBySlug(@Param('slug') slug: string): Promise<Category> {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id/stats')
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiOperation({
    summary: 'Obtener estadísticas de la categoría',
    description: 'Retorna estadísticas como número de profesionales y servicios',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de la categoría',
    schema: {
      type: 'object',
      properties: {
        professionalCount: { type: 'number', example: 25 },
        serviceCount: { type: 'number', example: 150 },
        averageRating: { type: 'number', example: 4.5 },
        totalServices: { type: 'number', example: 150 },
      },
    },
  })
  async getCategoryStats(@Param('id') id: string) {
    return this.categoriesService.getCategoryStats(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiOperation({
    summary: 'Actualizar categoría',
    description: 'Actualiza una categoría existente',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría actualizada exitosamente',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'Categoría no encontrada',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiQuery({ name: 'status', enum: ['active', 'inactive', 'pending'] })
  @ApiOperation({
    summary: 'Cambiar estado de la categoría',
    description: 'Cambia el estado de una categoría (activa, inactiva, pendiente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la categoría cambiado exitosamente',
    type: Category,
  })
  async changeStatus(
    @Param('id') id: string,
    @Query('status') status: string,
  ): Promise<Category> {
    return this.categoriesService.changeStatus(id, status as any);
  }

  @Patch(':id/toggle-visibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiOperation({
    summary: 'Alternar visibilidad de la categoría',
    description: 'Cambia la visibilidad de una categoría (visible/oculta)',
  })
  @ApiResponse({
    status: 200,
    description: 'Visibilidad de la categoría cambiada exitosamente',
    type: Category,
  })
  async toggleVisibility(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.toggleVisibility(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar categoría',
    description: 'Elimina una categoría (solo si no tiene profesionales o servicios asociados)',
  })
  @ApiResponse({
    status: 204,
    description: 'Categoría eliminada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar la categoría',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
