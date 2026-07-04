import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'Class 10A' })
  @IsString()
  @IsNotEmpty()
  className: string;
}
