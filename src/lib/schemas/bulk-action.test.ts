import { describe, it, expect } from 'vitest';
import { BulkActionSchema } from './bulk-action';

describe('BulkActionSchema', () => {
  it('accepts a valid single id', () => {
    const r = BulkActionSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(r.success).toBe(true);
  });

  it('accepts a valid array of ids', () => {
    const r = BulkActionSchema.safeParse({
      ids: [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
      ],
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty input', () => {
    const r = BulkActionSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it('rejects non-UUID id', () => {
    const r = BulkActionSchema.safeParse({ id: 'not-a-uuid' });
    expect(r.success).toBe(false);
  });

  it('rejects ids array over 100', () => {
    const ids = Array.from({ length: 101 }).map(
      (_, i) =>
        '123e4567-e89b-12d3-a456-' + String(i).padStart(12, '0')
    );
    const r = BulkActionSchema.safeParse({ ids });
    expect(r.success).toBe(false);
  });
});
