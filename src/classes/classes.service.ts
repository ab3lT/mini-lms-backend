import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateClassDto) {
    return this.prisma.class.create({ data: dto });
  }

  findAll() {
    return this.prisma.class.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const cls = await this.prisma.class.findUnique({ where: { id } });
    if (!cls) {
      throw new NotFoundException(`Class with id ${id} not found`);
    }
    return cls;
  }

  async update(id: number, dto: UpdateClassDto) {
    await this.findOne(id);
    return this.prisma.class.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.class.delete({ where: { id } });
    return { message: `Class ${id} deleted` };
  }
}
