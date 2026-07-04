import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';

// studentId is immutable after creation - to move a payment record to a
// different student, delete and recreate it instead.
export class UpdatePaymentDto extends PartialType(OmitType(CreatePaymentDto, ['studentId'] as const)) {}
