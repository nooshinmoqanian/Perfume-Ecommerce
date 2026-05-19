import { Producer } from 'kafkajs';
import { getKafkaClient } from './client';
import { getKafkaConfig } from './config';
import { toKafkaHeaders } from './headers';
import type { KafkaMessageHeaders } from './types';

let producer: Producer | null = null;

export async function initProducer() {
  if (producer) {
    return;
  }

  const kafka = getKafkaClient();
  producer = kafka.producer();

  await producer.connect();
  console.log('[order:kafka] Producer connected');
}

async function getProducer(): Promise<Producer> {
  if (!producer) {
    await initProducer();
  }

  if (!producer) {
    throw new Error('Producer was not initialized');
  }

  return producer;
}

export async function sendKafkaEvent(
  topic: string,
  payload: unknown,
  headers?: KafkaMessageHeaders,
  key?: string
) {
  const activeProducer = await getProducer();
  const config = getKafkaConfig();

  try {
    await activeProducer.send({
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(payload),
          headers: toKafkaHeaders(headers),
        },
      ],
      timeout: config.sendTimeoutMs,
    });
  } catch (err) {
    console.error('[order:kafka] Failed to send event', {
      topic,
      key,
      error: err,
    });
    throw err;
  }
}

export async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    producer = null;
    console.log('[order:kafka] Producer disconnected');
  }
}
