import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { Role } from '../common/enums/role.enum';

const STUDENT_SELECT = { id: true, username: true, classId: true } as const;

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    await this.assertStudentExists(dto.studentId);

    const amountPaid = dto.amountPaid ?? 0;
    const status = dto.status ?? this.deriveStatus(dto.amountDue, amountPaid);

    return this.prisma.payment.create({
      data: {
        studentId: dto.studentId,
        amountDue: new Prisma.Decimal(dto.amountDue),
        amountPaid: new Prisma.Decimal(amountPaid),
        status,
      },
      include: { student: { select: STUDENT_SELECT } },
    });
  }

  findAll() {
    return this.prisma.payment.findMany({
      include: { student: { select: STUDENT_SELECT } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { student: { select: STUDENT_SELECT } },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return payment;
  }

  async findByStudent(studentId: number) {
    await this.assertStudentExists(studentId);
    return this.prisma.payment.findMany({
      where: { studentId },
      include: { student: { select: STUDENT_SELECT } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(id: number, dto: UpdatePaymentDto) {
    const existing = await this.findOne(id);

    const amountDue = dto.amountDue ?? Number(existing.amountDue);
    const amountPaid = dto.amountPaid ?? Number(existing.amountPaid);
    const status = dto.status ?? this.deriveStatus(amountDue, amountPaid);

    return this.prisma.payment.update({
      where: { id },
      data: {
        amountDue: dto.amountDue !== undefined ? new Prisma.Decimal(dto.amountDue) : undefined,
        amountPaid: dto.amountPaid !== undefined ? new Prisma.Decimal(dto.amountPaid) : undefined,
        status,
      },
      include: { student: { select: STUDENT_SELECT } },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.payment.delete({ where: { id } });
    return { message: `Payment ${id} deleted` };
  }

  /**
   * Global view: every student, grouped by class, with their payment
   * records attached. Powers the accountant's "students by class" screen.
   */
  async listStudentsGroupedByClass() {
    const classes = await this.prisma.class.findMany({
      include: {
        students: {
          where: { role: Role.STUDENT },
          select: {
            id: true,
            username: true,
            payments: { orderBy: { updatedAt: 'desc' } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Students not yet assigned to any class still need to show up somewhere
    // for the accountant, so surface them under an "Unassigned" bucket.
    const unassigned = await this.prisma.user.findMany({
      where: { role: Role.STUDENT, classId: null },
      select: { id: true, username: true, payments: { orderBy: { updatedAt: 'desc' } } },
    });

    return [
      ...classes.map((cls) => ({
        classId: cls.id,
        className: cls.className,
        students: cls.students,
      })),
      ...(unassigned.length > 0
        ? [{ classId: null, className: 'Unassigned', students: unassigned }]
        : []),
    ];
  }

  private deriveStatus(amountDue: number, amountPaid: number): PaymentStatus {
    if (amountPaid <= 0) return PaymentStatus.UNPAID;
    if (amountPaid >= amountDue) return PaymentStatus.PAID;
    return PaymentStatus.PARTIAL;
  }

  private async assertStudentExists(studentId: number) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== Role.STUDENT) {
      throw new BadRequestException(`User with id ${studentId} is not a valid STUDENT account`);
    }
  }
}
