import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8, { message: 'newPassword must be at least 8 characters long' })
  newPassword: string;
}
