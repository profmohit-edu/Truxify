import { beforeEach, describe, expect, it, vi } from 'vitest';

const admin = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  listConsumerGroupOffsets: vi.fn(),
};

vi.mock('kafkajs', () => ({
  Kafka: vi.fn().mockImplementation(() => ({
    admin: () => admin,
    producer: vi.fn(),
    consumer: vi.fn(),
  })),
}));

vi.mock('../../api/src/middleware/logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const { default: kafkaConfig } = await import('../config/kafka.config.js');

describe('KafkaConfig.getConsumerGroupOffsets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    admin.connect.mockResolvedValue(undefined);
    admin.disconnect.mockResolvedValue(undefined);
  });

  it('disconnects the admin client after a successful offset lookup', async () => {
    const offsets = { topics: [{ topic: 'orders', partitions: [] }] };
    admin.listConsumerGroupOffsets.mockResolvedValue(offsets);

    await expect(kafkaConfig.getConsumerGroupOffsets('order-service')).resolves.toEqual(offsets);

    expect(admin.connect).toHaveBeenCalledTimes(1);
    expect(admin.listConsumerGroupOffsets).toHaveBeenCalledWith('order-service');
    expect(admin.disconnect).toHaveBeenCalledTimes(1);
  });

  it('disconnects the admin client and rethrows when offset lookup fails', async () => {
    const brokerError = new Error('broker unavailable');
    admin.listConsumerGroupOffsets.mockRejectedValue(brokerError);

    await expect(kafkaConfig.getConsumerGroupOffsets('order-service')).rejects.toBe(brokerError);

    expect(admin.connect).toHaveBeenCalledTimes(1);
    expect(admin.disconnect).toHaveBeenCalledTimes(1);
  });
});
