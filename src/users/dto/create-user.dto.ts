import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsString, MinLength, ValidateIf } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'jane' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ enum: Role, example: Role.STUDENT })
  @IsEnum(Role, { message: `role must be one of: ${Object.values(Role).join(', ')}` })
  role: Role;

  // Only meaningful for STUDENT accounts. Required (and validated) when
  // role is STUDENT; ignored entirely for every other role - the service
  // layer forces classId to null for non-students regardless of input.
  @ApiPropertyOptional({ example: 1 })
  @ValidateIf((dto: CreateUserDto) => dto.role === Role.STUDENT)
  @IsInt({ message: 'classId is required and must be an integer when role is STUDENT' })
  @Type(() => Number)
  classId?: number;
}
