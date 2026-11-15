import { describe, expect, it } from 'vitest';
import { MemoryRepository } from '../server/memory-repository.js';

describe('device isolation and check-in', () => {
  it('rejects unknown pairing codes', async () => { expect(await new MemoryRepository().activate('000000')).toBeNull(); });
  it('pairs the demo kiosk and creates a visit', async () => {
    const repo = new MemoryRepository(); const activation = await repo.activate('482731'); expect(activation?.context.tenantId).toBe('tenant-hartwell');
    const result = await repo.createCheckIn(activation!.context, { type: 'appointment', firstName: 'Ada', lastName: 'Lovelace', consent: true });
    expect(result.id).toBeTruthy(); expect(result.wait).toBe(6);
  });
  it('does not return config across tenant boundaries', async () => {
    const config = await new MemoryRepository().config({ tenantId: 'other', locationId: 'loc-downtown', kioskId: 'kiosk-lobby-01' }); expect(config).toBeNull();
  });
});
