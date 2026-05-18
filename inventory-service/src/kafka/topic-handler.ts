import type { KafkaMessageHeaders } from './types';

export interface TopicHandlerContext<TPayload = unknown> {
	topic: string;
	partition: number;
	offset: string;
	key?: string;
	payload: TPayload;
	rawValue: string;
	headers?: KafkaMessageHeaders;
	requestId?: string;
}

export type KafkaTopicHandler<TPayload = unknown> = (context: TopicHandlerContext<TPayload>) => Promise<void>;
