import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// Admin can update username/role/classId but not password here - password
// changes go through the dedicated ResetPasswordDto/endpoint so that action
// is auditable and separate from a generic profile edit.
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {}
