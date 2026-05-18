import { plainToInstance, Transform } from 'class-transformer';
import { IsNumber, IsString, Min, validateSync } from 'class-validator';
import { BadRequestError } from '../errors/app-errors';

function asTrimmedString(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmedValue = value.trim();
  return trimmedValue.length ? trimmedValue : value;
}

function asNumber(value: unknown): unknown {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.length) return value;
  const parsedNumber = Number(trimmed);
  return Number.isFinite(parsedNumber) ? parsedNumber : value;
}

export class ReserveDto {
  @Transform(({ value }) => asTrimmedString(value))
  @IsString()
  productId!: string;

  @Transform(({ value }) => asNumber(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1)
  quantity!: number;
}

export function validateReserveDto(body: any): ReserveDto {
  if (!body || typeof body !== 'object') throw new BadRequestError('Invalid payload');

  const dto = plainToInstance(ReserveDto, body);
  const errors = validateSync(dto, { whitelist: true });

  if (errors.length) {
    const first = errors[0];
    const message = first.constraints ? Object.values(first.constraints)[0] : 'Invalid reserve payload';
    throw new BadRequestError(message);
  }

  return dto;
}

export default { validateReserveDto, ReserveDto };
