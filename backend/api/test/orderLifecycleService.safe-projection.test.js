import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const servicePath = fileURLToPath(
  new URL('../src/services/order/orderLifecycleService.js', import.meta.url),
);
const serviceSource = readFileSync(servicePath, 'utf8');

function getOrderDetailProjection() {
  const match = serviceSource.match(
    /findOrderByAnyId\(orderId,\s*['"]([^'"]+)['"]\)/,
  );
  expect(match, 'getOrderDetail should pass an explicit column projection').not.toBeNull();
  return match[1]
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);
}

describe('OrderLifecycleService.getOrderDetail client projection', () => {
  it('uses an explicit allowlist containing fields required for authorization and order display', () => {
    const columns = getOrderDetailProjection();

    expect(columns).not.toContain('*');
    expect(columns).toEqual(expect.arrayContaining([
      'id',
      'order_display_id',
      'customer_id',
      'driver_id',
      'truck_id',
      'status',
      'pickup_address',
      'pickup_lat',
      'pickup_lng',
      'drop_address',
      'drop_lat',
      'drop_lng',
      'pickup_date',
      'pickup_time',
      'goods_type',
      'weight_tonnes',
      'total_amount',
      'eta',
      'truck_number',
      'created_at',
      'updated_at',
    ]));
  });

  it('does not expose payment, OTP, blockchain, or escrow internals', () => {
    const columns = getOrderDetailProjection();
    const sensitiveColumns = [
      'delivery_otp',
      'payment_method_id',
      'upi_id',
      'blockchain_tx_hash',
      'escrow_status',
      'escrow_amount_wei',
      'escrow_refund_amount',
      'escrow_release_attempts',
      'release_tx_hash',
      'refund_tx_hash',
      'pending_bid_acceptance',
      'escrow_funding_error',
      'escrow_refund_error',
      'escrow_release_error',
    ];

    for (const column of sensitiveColumns) {
      expect(columns).not.toContain(column);
    }
  });
});
