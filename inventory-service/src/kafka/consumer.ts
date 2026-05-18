import type { Consumer, KafkaMessage } from 'kafkajs';
import { AppError } from '../errors/app-errors';
import { getKafkaClient } from './client';
import { getKafkaConfig } from './config';
import { fromKafkaHeaders, getHeaderString } from './headers';
import { defaultTopicHandlers } from './handlers';
import type { KafkaTopicHandler } from './topic-handler';
import { INVENTORY_CONSUMER_TOPICS } from './topics';

let consumer: Consumer | null = null;
const topicHandlers = new Map<string, KafkaTopicHandler>();
let defaultsRegistered = false;

function registerDefaultTopicHandlers() {
  if (defaultsRegistered) return;

  for (const [topic, handler] of Object.entries(defaultTopicHandlers)) {
    topicHandlers.set(topic, handler);
  }

  defaultsRegistered = true;
}

export function registerTopicHandler(topic: string, handler: KafkaTopicHandler): void {
  topicHandlers.set(topic, handler);
}

export function unregisterTopicHandler(topic: string): void {
  topicHandlers.delete(topic);
}

export async function initConsumer() {
  if (consumer) return;

  registerDefaultTopicHandlers();

  const config = getKafkaConfig();

  try {
    const kafka = getKafkaClient();
    consumer = kafka.consumer({ groupId: config.consumerGroupId });
    await consumer.connect();
    console.log('[inventory:kafka] Consumer connected', {
      brokers: config.brokers.join(','),
      groupId: config.consumerGroupId,
      topics: Array.from(topicHandlers.keys()),
    });
  } catch (err) {
    console.error('[inventory:kafka] Failed to initialize consumer', err);
    throw err;
  }
}

function parseMessageValue(value: Buffer | null): { ok: true; payload: unknown; raw: string } | { ok: false; raw: string } {
  if (!value) return { ok: false, raw: '' };

  const raw = value.toString();
  if (!raw) return { ok: false, raw };

  try {
    return {
      ok: true,
      payload: JSON.parse(raw),
      raw,
    };
  } catch {
    return { ok: false, raw };
  }
}

async function processMessage(topic: string, partition: number, message: KafkaMessage): Promise<void> {
  const parsed = parseMessageValue(message.value);

  if (!parsed.ok) {
    console.warn('[inventory:kafka] Invalid or empty message, skipping', {
      topic,
      partition,
      offset: message.offset,
      raw: parsed.raw,
    });
    return;
  }

  const handler = topicHandlers.get(topic);
  if (!handler) {
    console.warn('[inventory:kafka] No handler registered for topic', topic);
    return;
  }

  const headers = fromKafkaHeaders(message.headers);
  const requestId = getHeaderString(message.headers, 'x-request-id');

  await handler({
    topic,
    partition,
    offset: message.offset,
    key: message.key?.toString(),
    payload: parsed.payload,
    rawValue: parsed.raw,
    headers,
    requestId,
  });
}

export async function runConsumer() {
  if (!consumer) throw new AppError('Consumer not initialized. Call initConsumer() first.');

  for (const topic of INVENTORY_CONSUMER_TOPICS) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        await processMessage(topic, partition, message);
      } catch (error) {
        console.warn('[inventory:kafka] Failed to process message', {
          topic,
          partition,
          offset: message.offset,
          error,
        });
      }
    },
  });
}

export async function disconnectConsumer() {
  if (consumer) {
    try {
      await consumer.disconnect();
      consumer = null;
      console.log('[inventory:kafka] Consumer disconnected');
    } catch (err) {
      console.error('[inventory:kafka] Error disconnecting consumer', err);
      throw err;
    }
  }
}

