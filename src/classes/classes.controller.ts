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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Create a class' })
  @ApiBody({ type: CreateClassDto })
  @ApiResponse({ status: 201, description: 'Class created successfully' })
  create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  // Readable by any authenticated role (teachers/students need class lists
  // for context elsewhere in the app); writes remain admin/moderator-only.
  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR, Role.TEACHER, Role.STUDENT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get all classes' })
  @ApiResponse({ status: 200, description: 'Classes retrieved successfully' })
  findAll() {
    return this.classesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MODERATOR, Role.TEACHER, Role.STUDENT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get a class by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Class retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Update a class' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateClassDto })
  @ApiResponse({ status: 200, description: 'Class updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClassDto) {
    return this.classesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Delete a class' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Class deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.remove(id);
  }
}
