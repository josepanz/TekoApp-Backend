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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dtos/request/create-category.dto';
import { UpdateCategoryDto } from '../dtos/request/update-category.dto';
import { CategoryStatus } from '@prisma/client';

@ApiTags('Categorías')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear nueva categoría',
    description: 'Crea una nueva categoría de servicios profesionales.',
  })
  @ApiResponse({ status: 201, description: 'Categoría creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una categoría con este nombre.',
  })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las categorías',
    description: 'Retorna todas las categorías activas y visibles.',
  })
  @ApiResponse({ status: 200, description: 'Lista de categorías activas.' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener todas las categorías (incluyendo inactivas)',
    description:
      'Retorna todo el árbol de categorías para panel de administración.',
  })
  async findAllWithRelations() {
    return this.categoriesService.findAllWithRelations();
  }

  @Get('main')
  @ApiOperation({
    summary: 'Obtener categorías principales',
    description: 'Retorna raíz de categorías (Filtra las subcategorías).',
  })
  async findMainCategories() {
    return this.categoriesService.findMainCategories();
  }

  @Get('subcategories/:parentId')
  @ApiParam({
    name: 'parentId',
    description: 'ID UUID de la categoría padre',
    type: String,
  })
  @ApiOperation({
    summary: 'Obtener subcategorías',
    description: 'Retorna las subcategorías hijas de una categoría raíz.',
  })
  async findSubcategories(@Param('parentId', ParseIntPipe) parentId: number) {
    return this.categoriesService.findSubcategories(parentId);
  }

  @Get('search')
  @ApiQuery({ name: 'q', description: 'Término o palabra clave de búsqueda' })
  @ApiOperation({
    summary: 'Buscar categorías',
    description: 'Busca coincidencias por nombre o descripciones indexadas.',
  })
  async searchCategories(@Query('q') query: string) {
    return this.categoriesService.searchCategories(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID UUID de la categoría' })
  @ApiOperation({
    summary: 'Obtener categoría por ID',
    description: 'Busca de forma exacta un registro por ID.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiParam({ name: 'slug', description: 'Slug único estructurado url-ready' })
  @ApiOperation({ summary: 'Obtener categoría por slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id/stats')
  @ApiParam({ name: 'id', description: 'ID UUID de la categoría' })
  @ApiOperation({ summary: 'Obtener métricas y contadores de la categoría' })
  async getCategoryStats(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.getCategoryStats(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'ID UUID de la categoría' })
  @ApiOperation({ summary: 'Actualizar categoría de forma parcial' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'ID UUID de la categoría' })
  @ApiQuery({ name: 'status', enum: ['active', 'inactive', 'pending'] })
  @ApiOperation({ summary: 'Mutar estado transaccional de una categoría' })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status: CategoryStatus,
  ) {
    return this.categoriesService.changeStatus(id, status);
  }

  @Patch(':id/toggle-visibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'ID UUID de la categoría' })
  @ApiOperation({ summary: 'Invertir bandera de visibilidad pública' })
  async toggleVisibility(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.toggleVisibility(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'ID UUID de la categoría' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar físicamente una categoría' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
