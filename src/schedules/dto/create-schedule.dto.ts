import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ example: 'Algebra class' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'https://example.com/resources/algebra.pdf' })
  @IsUrl({}, { message: 'resourceUrl must be a valid URL' })
  resourceUrl: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  classId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Type(() => Number)
  subjectId: number;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  teacherId: string;

  // ISO 8601 date/date-time string, e.g. "2026-07-10" or
  // "2026-07-10T09:00:00Z". Always interpreted/compared in UTC.
  @ApiProperty({ example: '2026-07-10T09:00:00Z' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ example: 'https://meet.google.com/abc-defg-hij' })
  @IsUrl({}, { message: 'googleMeetUrl must be a valid URL' })
  googleMeetUrl: string;
}
