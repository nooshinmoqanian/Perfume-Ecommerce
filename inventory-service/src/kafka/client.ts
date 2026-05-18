import { Kafka } from 'kafkajs';
import { getKafkaConfig } from './config';

let kafkaClient: Kafka | null = null;

export function getKafkaClient(): Kafka {
  if (!kafkaClient) {
    const config = getKafkaConfig();
    kafkaClient = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
    });
  }

  return kafkaClient;
}
