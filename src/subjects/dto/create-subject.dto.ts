import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  subjectName: string;
}
