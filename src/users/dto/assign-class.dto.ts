import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AssignClassDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  classId: number;
}
