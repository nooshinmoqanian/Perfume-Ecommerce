interface KafkaRuntimeConfig {
  clientId: string;
  brokers: string[];
  consumerGroupId: string;
  sendTimeoutMs: number;
}

const DEFAULT_BROKER = 'kafka:9092';
const DEFAULT_CLIENT_ID = 'order-service';
const DEFAULT_GROUP_ID = 'order-events-group';

function parseBrokers(rawBrokerList: string | undefined): string[] {
  const brokerList = (rawBrokerList || DEFAULT_BROKER)
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);

  return brokerList.length ? brokerList : [DEFAULT_BROKER];
}

export function getKafkaConfig(): KafkaRuntimeConfig {
  return {
    clientId: process.env.KAFKA_CLIENT_ID || DEFAULT_CLIENT_ID,
    brokers: parseBrokers(process.env.KAFKA_BROKER),
    consumerGroupId: process.env.KAFKA_GROUP_ID || DEFAULT_GROUP_ID,
    sendTimeoutMs: Number(process.env.KAFKA_SEND_TIMEOUT_MS || '5000'),
  };
}
