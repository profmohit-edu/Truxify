import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  get supabase() { return null; },
  get supabaseAdmin() { return null; },
  get redisClient() { return null; },
  get mongoDb() { return null; },
  get firebaseAdmin() { return null; },
}));

vi.mock('../src/middleware/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../src/core/performanceMetrics.js', () => ({
  measureExecution: (name, fn) => fn(),
}));

vi.mock('../src/core/events/index.js', () => ({
  eventBus: { emit: vi.fn(), on: vi.fn(), once: vi.fn() },
  EventBus: class {},
}));

vi.mock('../src/services/escrow.js', () => ({
  submitEscrowRefund: vi.fn(),
  recordDepositTx: vi.fn(),
  submitEscrowCancelWithPenalty: vi.fn(),
  confirmEscrowRefund: vi.fn(),
  getEscrowBookingId: vi.fn(),
  resolveExpectedDepositAmount: vi.fn(),
  paisaToMaticWei: vi.fn(),
}));

const { OrderLifecycleService } = await import('../src/services/order/orderLifecycleService.js');

describe('OrderLifecycleService.getOrderDetail privacy', () => {
  it('requests an explicit client-safe order column list instead of select star', async () => {
    const findOrderByAnyId = vi.fn().mockResolvedValue({
      data: {
        id: 'order-1',
        order_display_id: 'TRX-1001',
        customer_id: 'user-1',
        driver_id: 'driver-1',
        status: 'in_transit',
        pickup_address: 'A',
        drop_address: 'B',
        total_amount: 120000,
      },
      error: null,
    });

    const service = new OrderLifecycleService({
      orderRepository: {
        findOrderByAnyId,
        findProfile: vi.fn().mockResolvedValue({ data: null }),
        findDriverDetail: vi.fn().mockResolvedValue({ data: null }),
      },
      orderTimelineService: {
        getTimeline: vi.fn().mockResolvedValue({ data: [] }),
      },
    });

    const result = await service.getOrderDetail('TRX-1001', 'user-1');
    const selectedColumns = findOrderByAnyId.mock.calls[0][1];

    expect(selectedColumns).not.toBe('*');
    expect(selectedColumns).toContain('order_display_id');
    expect(selectedColumns).toContain('pickup_address');
    expect(selectedColumns).toContain('drop_address');
    expect(selectedColumns).toContain('total_amount');

    expect(selectedColumns).not.toContain('delivery_otp');
    expect(selectedColumns).not.toContain('upi_id');
    expect(selectedColumns).not.toContain('payment_method_id');
    expect(selectedColumns).not.toContain('escrow_status');
    expect(selectedColumns).not.toContain('escrow_amount_wei');
    expect(selectedColumns).not.toContain('release_tx_hash');
    expect(selectedColumns).not.toContain('refund_tx_hash');
    expect(result.order.order_display_id).toBe('TRX-1001');
  });
});
