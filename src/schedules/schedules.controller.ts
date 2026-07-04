import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@ApiTags('schedules')
@ApiBearerAuth()
@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private schedulesService: SchedulesService) {}

  // Moderator (and admin) creates a schedule slot: binds class + subject +
  // resource + teacher + date + Google Meet link.
  @Post()
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Create a schedule' })
  @ApiBody({ type: CreateScheduleDto })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  // Scoping/gating is handled per-role in the service: admins & moderators
  // see everything, teachers see their own assignments, students see only
  // their class's schedules with the date-gating rules applied.
  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: 'Get schedules for the current user' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.schedulesService.findAllForUser(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MODERATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: 'Get a schedule by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.schedulesService.findOneForUser(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateScheduleDto })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.remove(id);
  }
}
