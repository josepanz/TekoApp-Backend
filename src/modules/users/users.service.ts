import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, UserStatus, UserProfileStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.extended.users.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un usuario con este email');
    }
    return this.prisma.extended.users.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        documentTypeId: dto.documentTypeId,
        access_level: dto.access_level,
        createdBy: dto.createdBy,
        phoneNumber: dto.phoneNumber,
        documentNumber: dto.documentNumber,
      },
    });
  }

  async findAll() {
    return this.prisma.extended.users.findMany({
      select: {
        id: true,
        referenceId: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        profileStatus: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: number | string) {
    const user = await this.prisma.extended.users.findUnique({
      where: { id: Number(id) },
      include: { professionals: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByReferenceId(referenceId: string) {
    const user = await this.prisma.extended.users.findUnique({
      where: { referenceId },
      include: { professionals: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.extended.users.findUnique({
      where: { email },
      include: { professionals: true },
    });
  }

  async update(id: number | string, data: Prisma.UsersUpdateInput) {
    const numId = Number(id);
    await this.findOne(numId);
    return this.prisma.extended.users.update({ where: { id: numId }, data });
  }

  async remove(id: number | string) {
    const numId = Number(id);
    await this.findOne(numId);
    return this.prisma.extended.users.update({
      where: { id: numId },
      data: { status: UserStatus.DELETED },
    });
  }

  async verifyEmail(id: number | string) {
    const numId = Number(id);
    await this.findOne(numId);
    return this.prisma.extended.users.update({
      where: { id: numId },
      data: { profileStatus: UserProfileStatus.COMPLETE },
    });
  }

  async updateLastLogin(id: number | string) {
    await this.prisma.extended.users.update({
      where: { id: Number(id) },
      data: { lastLogin: new Date() },
    });
  }

  async verifyPhone(id: number | string) {
    const numId = Number(id);
    await this.findOne(numId);
    return this.prisma.extended.users.update({
      where: { id: numId },
      data: { profileStatus: UserProfileStatus.COMPLETE },
    });
  }

  async deactivate(id: number | string) {
    const numId = Number(id);
    await this.findOne(numId);
    return this.prisma.extended.users.update({
      where: { id: numId },
      data: { status: UserStatus.INACTIVE },
    });
  }

  async activate(id: number | string) {
    const numId = Number(id);
    await this.findOne(numId);
    return this.prisma.extended.users.update({
      where: { id: numId },
      data: { status: UserStatus.ACTIVE },
    });
  }

  async getUsersCount() {
    const [total, professionals] = await Promise.all([
      this.prisma.extended.users.count(),
      this.prisma.extended.users.count({
        where: { professionals: { isNot: null } },
      }),
    ]);
    return { total, clients: total - professionals, professionals };
  }
}
