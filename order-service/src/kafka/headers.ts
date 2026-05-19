import type { IHeaders } from 'kafkajs';
import type { KafkaMessageHeaders } from './types';

function normalizeHeaderValue(
  value: Buffer | string | (Buffer | string)[] | undefined
): string | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    const first = value[0];
    if (first === undefined) return undefined;
    return Buffer.isBuffer(first) ? first.toString() : String(first);
  }
  if (Buffer.isBuffer(value)) return value.toString();
  return String(value);
}

export function toKafkaHeaders(headers?: KafkaMessageHeaders): IHeaders | undefined {
  if (!headers) return undefined;

  const result: IHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = Buffer.from(String(value));
  }
  return result;
}

export function fromKafkaHeaders(headers?: IHeaders): KafkaMessageHeaders | undefined {
  if (!headers) return undefined;

  const result: KafkaMessageHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    const normalized = normalizeHeaderValue(value);
    if (normalized !== undefined && normalized !== '') {
      result[key] = normalized;
    }
  }

  return Object.keys(result).length ? result : undefined;
}

export function getHeaderString(headers: IHeaders | undefined, key: string): string | undefined {
  if (!headers || !(key in headers)) return undefined;
  return normalizeHeaderValue(headers[key]);
}
