import { plainToInstance, Transform } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
  ValidationError,
} from 'class-validator';
import { BadRequestError } from '../errors/app-errors';
import { normalizeFeaturesValue } from '../utils/normalize-features';

function asTrimmedString(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return value;
  const trimmedValue = value.trim();
  return trimmedValue.length ? trimmedValue : undefined;
}

function asFiniteNumber(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.length) return undefined;
  const parsedNumber = Number(trimmed);
  return Number.isFinite(parsedNumber) ? parsedNumber : value;
}

function asFeatures(value: unknown): unknown {
  const normalizedFeatures = normalizeFeaturesValue(value, { emptyAsUndefined: true });
  return normalizedFeatures === undefined ? value : normalizedFeatures;
}

function collectMessages(errors: ValidationError[], prefix = ''): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.constraints) {
      messages.push(...Object.values(error.constraints).map((constraintMessage) => `${path}: ${constraintMessage}`));
    }
    if (error.children?.length) {
      messages.push(...collectMessages(error.children, path));
    }
  }

  return messages;
}

export class CreateProductDto {
  @Transform(({ value }) => asTrimmedString(value))
  @IsOptional()
  @IsString()
  name?: string;

  @Transform(({ value }) => asTrimmedString(value))
  @IsOptional()
  @IsString()
  category?: string;

  @Transform(({ value }) => asTrimmedString(value))
  @IsOptional()
  @IsString()
  sku?: string;

  @Transform(({ value }) => asFiniteNumber(value))
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  stock?: number;

  @Transform(({ value }) => asFiniteNumber(value))
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  price?: number;

  @Transform(({ value }) => asTrimmedString(value))
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Transform(({ value }) => asFeatures(value))
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @Transform(({ value }) => asTrimmedString(value))
  @IsOptional()
  @IsString()
  extraDescription?: string;
}

export function validateCreateProductDto(body: any): CreateProductDto {
  if (!body || typeof body !== 'object') throw new BadRequestError('Invalid payload');

  const dto = plainToInstance(CreateProductDto, body);
  const errors = validateSync(dto, { whitelist: true });

  if (errors.length) {
    const details = collectMessages(errors);
    throw new BadRequestError(details[0] || 'Invalid product payload');
  }

  if (!dto.name) dto.name = 'unnamed';
  if (dto.stock === undefined) dto.stock = 0;

  return dto;
}

export default { validateCreateProductDto, CreateProductDto };
