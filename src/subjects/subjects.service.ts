import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateSubjectDto) {
    return this.prisma.subject.create({ data: dto });
  }

  findAll() {
    return this.prisma.subject.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      throw new NotFoundException(`Subject with id ${id} not found`);
    }
    return subject;
  }

  async update(id: number, dto: UpdateSubjectDto) {
    await this.findOne(id);
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.subject.delete({ where: { id } });
    return { message: `Subject ${id} deleted` };
  }
}
