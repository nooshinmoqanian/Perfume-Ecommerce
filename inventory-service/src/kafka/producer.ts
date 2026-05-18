import type { Producer } from 'kafkajs';
import { getKafkaClient } from './client';
import { getKafkaConfig } from './config';
import { toKafkaHeaders } from './headers';
import type { KafkaMessageHeaders } from './types';

let producer: Producer | null = null;

export async function initProducer() {
  if (producer) return;

  const config = getKafkaConfig();

  try {
    const kafka = getKafkaClient();
    producer = kafka.producer();
    await producer.connect();
    console.log('[inventory:kafka] Producer connected', {
      brokers: config.brokers.join(','),
      clientId: config.clientId,
    });
  } catch (err) {
    console.error('[inventory:kafka] Failed to initialize producer', err);
    throw err;
  }
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

export async function sendInventoryEvent(
  topic: string,
  payload: any,
  headers?: KafkaMessageHeaders,
  key?: string
): Promise<void> {
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
    console.error('[inventory:kafka] Failed to send event', {
      topic,
      key,
      error: err,
    });
    throw err;
  }
}

export async function disconnectProducer() {
  if (producer) {
    try {
      await producer.disconnect();
      producer = null;
      console.log('[inventory:kafka] Producer disconnected');
    } catch (err) {
      console.error('[inventory:kafka] Error disconnecting producer', err);
      throw err;
    }
  }
}

