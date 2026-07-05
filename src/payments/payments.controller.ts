import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

// Accountant-only, full stop. RolesGuard rejects ADMIN, MODERATOR, TEACHER
// and STUDENT with a 403 at the guard level - none of them can reach any
// handler in this controller regardless of client-side UI.
@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ACCOUNTANT)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findAll() {
    return this.paymentsService.findAll();
  }

  // Global list of students grouped by class, each with their payment info.
  @Get('by-class')
  @ApiOperation({ summary: 'Get students grouped by class with payment details' })
  @ApiResponse({ status: 200, description: 'Payment summary retrieved successfully' })
  listStudentsGroupedByClass() {
    return this.paymentsService.listStudentsGroupedByClass();
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get payments for a student' })
  @ApiParam({ name: 'studentId', type: String })
  @ApiResponse({ status: 200, description: 'Student payments retrieved successfully' })
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.paymentsService.findByStudent(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePaymentDto })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
