import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  async findAll(@Query('role') role?: UserRole) {
    if (role) {
      return this.usersService.findByRole(role);
    }
    return this.usersService.findAll();
  }

  @Get('count')
  @ApiOperation({ summary: 'Obtener conteo de usuarios' })
  @ApiResponse({ status: 200, description: 'Conteo obtenido exitosamente' })
  async getCount() {
    return this.usersService.getUsersCount();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/verify-email')
  @ApiOperation({ summary: 'Verificar email del usuario' })
  @ApiResponse({ status: 200, description: 'Email verificado exitosamente' })
  async verifyEmail(@Param('id') id: string) {
    return this.usersService.verifyEmail(id);
  }

  @Post(':id/verify-phone')
  @ApiOperation({ summary: 'Verificar teléfono del usuario' })
  @ApiResponse({ status: 200, description: 'Teléfono verificado exitosamente' })
  async verifyPhone(@Param('id') id: string) {
    return this.usersService.verifyPhone(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado exitosamente' })
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario activado exitosamente' })
  async activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }
}
