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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('subjects')
@ApiBearerAuth()
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Create a subject' })
  @ApiBody({ type: CreateSubjectDto })
  @ApiResponse({ status: 201, description: 'Subject created successfully' })
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR, Role.TEACHER, Role.STUDENT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiResponse({ status: 200, description: 'Subjects retrieved successfully' })
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MODERATOR, Role.TEACHER, Role.STUDENT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get a subject by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Subject retrieved successfully' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Update a subject' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateSubjectDto })
  @ApiResponse({ status: 200, description: 'Subject updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubjectDto) {
    return this.subjectsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Delete a subject' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Subject deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.remove(id);
  }
}
