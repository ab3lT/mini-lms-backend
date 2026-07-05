import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class CreatePaymentDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 150.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  amountDue: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  amountPaid?: number;

  // If omitted, the service derives status from amountDue/amountPaid.
  @ApiPropertyOptional({ enum: PaymentStatus, example: PaymentStatus.PARTIAL })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: `status must be one of: ${Object.values(PaymentStatus).join(', ')}` })
  status?: PaymentStatus;
}
