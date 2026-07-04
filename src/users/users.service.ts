import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '../common/enums/role.enum';

const SAFE_SELECT = {
  id: true,
  username: true,
  role: true,
  classId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Only students carry a class_id - force it to null for every other role
    // even if a caller tried to sneak one in.
    const classId = dto.role === Role.STUDENT ? dto.classId : null;

    if (dto.role === Role.STUDENT && classId) {
      await this.assertClassExists(classId);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        role: dto.role,
        classId: classId ?? null,
      },
      select: SAFE_SELECT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({ select: SAFE_SELECT, orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: { username?: string; role?: Role; classId?: number | null } = {};
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.role !== undefined) data.role = dto.role;

    if (dto.role !== undefined && dto.role !== Role.STUDENT) {
      data.classId = null;
    } else if (dto.classId !== undefined) {
      await this.assertClassExists(dto.classId);
      data.classId = dto.classId;
    }

    return this.prisma.user.update({ where: { id }, data, select: SAFE_SELECT });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: `User ${id} deleted` };
  }

  // Assigns/re-assigns a STUDENT to a class. Rejects non-students outright -
  // class assignment is a student-only concept per the data model.
  async assignClass(id: number, classId: number) {
    const user = await this.findOne(id);
    if (user.role !== Role.STUDENT) {
      throw new BadRequestException('Only STUDENT accounts can be assigned to a class');
    }
    await this.assertClassExists(classId);

    return this.prisma.user.update({
      where: { id },
      data: { classId },
      select: SAFE_SELECT,
    });
  }

  async resetPassword(id: number, dto: ResetPasswordDto) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: `Password reset for user ${id}` };
  }

  private async assertClassExists(classId: number) {
    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      throw new BadRequestException(`Class with id ${classId} does not exist`);
    }
  }
}
