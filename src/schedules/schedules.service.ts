import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { applyGating } from './utils/gate-status.util';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';
import { Role } from '../common/enums/role.enum';

const INCLUDE = {
  class: { select: { id: true, className: true } },
  subject: { select: { id: true, subjectName: true } },
  teacher: { select: { id: true, username: true } },
} as const;

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateScheduleDto) {
    await this.assertClassExists(dto.classId);
    await this.assertSubjectExists(dto.subjectId);
    await this.assertTeacherExists(dto.teacherId);

    return this.prisma.schedule.create({
      data: {
        title: dto.title,
        resourceUrl: dto.resourceUrl,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        scheduledDate: new Date(dto.scheduledDate),
        googleMeetUrl: dto.googleMeetUrl,
      },
      include: INCLUDE,
    });
  }

  /**
   * Returns schedules scoped to the requesting user's role:
   *  - ADMIN/MODERATOR: every schedule, ungated (full management view).
   *  - TEACHER: only schedules where they are the assigned teacher, ungated
   *    (they need to prepare/access materials ahead of the date).
   *  - STUDENT: only schedules for their own class, with date-gating applied
   *    to resource_url/google_meet_url.
   */
  async findAllForUser(user: AuthenticatedUser) {
    if (user.role === Role.ADMIN || user.role === Role.MODERATOR) {
      return this.prisma.schedule.findMany({ include: INCLUDE, orderBy: { scheduledDate: 'asc' } });
    }

    if (user.role === Role.TEACHER) {
      return this.prisma.schedule.findMany({
        where: { teacherId: user.userId },
        include: INCLUDE,
        orderBy: { scheduledDate: 'asc' },
      });
    }

    // STUDENT
    if (!user.classId) {
      return [];
    }
    const schedules = await this.prisma.schedule.findMany({
      where: { classId: user.classId },
      include: INCLUDE,
      orderBy: { scheduledDate: 'asc' },
    });
    return schedules.map((schedule) => applyGating(schedule));
  }

  async findOneForUser(id: number, user: AuthenticatedUser) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id }, include: INCLUDE });
    if (!schedule) {
      throw new NotFoundException(`Schedule with id ${id} not found`);
    }

    if (user.role === Role.ADMIN || user.role === Role.MODERATOR) {
      return schedule;
    }

    if (user.role === Role.TEACHER) {
      if (schedule.teacherId !== user.userId) {
        throw new ForbiddenException('You may only view schedules you are assigned to teach');
      }
      return schedule;
    }

    // STUDENT
    if (schedule.classId !== user.classId) {
      throw new ForbiddenException('You may only view schedules for your own class');
    }
    return applyGating(schedule);
  }

  async update(id: number, dto: UpdateScheduleDto) {
    await this.assertScheduleExists(id);
    if (dto.classId !== undefined) await this.assertClassExists(dto.classId);
    if (dto.subjectId !== undefined) await this.assertSubjectExists(dto.subjectId);
    if (dto.teacherId !== undefined) await this.assertTeacherExists(dto.teacherId);

    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...dto,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      },
      include: INCLUDE,
    });
  }

  async remove(id: number) {
    await this.assertScheduleExists(id);
    await this.prisma.schedule.delete({ where: { id } });
    return { message: `Schedule ${id} deleted` };
  }

  private async assertScheduleExists(id: number) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule with id ${id} not found`);
    }
    return schedule;
  }

  private async assertClassExists(classId: number) {
    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new BadRequestException(`Class with id ${classId} does not exist`);
  }

  private async assertSubjectExists(subjectId: number) {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new BadRequestException(`Subject with id ${subjectId} does not exist`);
  }

  private async assertTeacherExists(teacherId: number) {
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new BadRequestException(`User with id ${teacherId} is not a valid TEACHER account`);
    }
  }
}
