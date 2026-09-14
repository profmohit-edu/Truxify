import { describe, expect, it } from 'vitest';
import { ORDER_DETAIL_PUBLIC_COLUMNS } from '../../src/services/order/orderDetailProjection.js';

const selectedColumns = ORDER_DETAIL_PUBLIC_COLUMNS.split(',').map((column) => column.trim());

const SENSITIVE_COLUMNS = [
  'delivery_otp',
  'otp_verified',
  'otp_generated_at',
  'upi_id',
  'payment_method_id',
  'blockchain_tx_hash',
  'escrow_status',
  'escrow_amount_wei',
  'escrow_refund_amount',
  'escrow_release_attempts',
  'release_tx_hash',
  'refund_tx_hash',
];

describe('order detail public projection', () => {
  it('is an explicit allow-list rather than a wildcard projection', () => {
    expect(selectedColumns).not.toContain('*');
    expect(selectedColumns).toContain('customer_id');
    expect(selectedColumns).toContain('driver_id');
    expect(selectedColumns).toContain('order_display_id');
  });

  it.each(SENSITIVE_COLUMNS)('does not expose sensitive column %s', (column) => {
    expect(selectedColumns).not.toContain(column);
  });
});
