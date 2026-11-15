import { randomUUID } from 'node:crypto';
import pg from 'pg';
import type { CheckInPayload, DashboardData, KioskConfig } from '../src/types.js';
import type { DeviceContext, Repository } from './types.js';

const { Pool } = pg;

export class PostgresRepository implements Repository {
  private pool: pg.Pool;
  constructor(url: string) { this.pool = new Pool({ connectionString: url, ssl: url.includes('localhost') ? false : { rejectUnauthorized: true }, max: 10 }); }

  private async tenantQuery<T>(context: DeviceContext, callback: (client: pg.PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.tenant_id', $1, true), set_config('app.location_id', $2, true)`, [context.tenantId, context.locationId]);
      const result = await callback(client); await client.query('COMMIT'); return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }

  async activate(code: string) {
    const { rows } = await this.pool.query(`
      UPDATE device_activation_codes ac SET used_at = now()
      FROM kiosks k, locations l, organizations o
      WHERE ac.kiosk_id = k.id AND k.location_id = l.id AND l.organization_id = o.id
        AND ac.code_hash = encode(digest($1, 'sha256'), 'hex') AND ac.used_at IS NULL AND ac.expires_at > now()
      RETURNING o.id tenant_id, l.id location_id, k.id kiosk_id, o.name organization_name, l.name location_name, o.brand_color`, [code]);
    if (!rows[0]) return null;
    const row = rows[0]; const context = { tenantId: row.tenant_id, locationId: row.location_id, kioskId: row.kiosk_id };
    return { context, config: { organizationName: row.organization_name, locationName: row.location_name, ...context, brandColor: row.brand_color, welcomeMessage: 'How can we welcome you today?', appointmentCount: 0 } };
  }

  async config(context: DeviceContext): Promise<KioskConfig | null> {
    return this.tenantQuery(context, async client => {
      const { rows } = await client.query(`SELECT o.name organization_name, l.name location_name, o.brand_color FROM kiosks k JOIN locations l ON l.id=k.location_id JOIN organizations o ON o.id=l.organization_id WHERE k.id=$1`, [context.kioskId]);
      if (!rows[0]) return null; const row = rows[0];
      return { organizationName: row.organization_name, locationName: row.location_name, ...context, brandColor: row.brand_color, welcomeMessage: 'How can we welcome you today?', appointmentCount: 0 };
    });
  }

  async createCheckIn(context: DeviceContext, payload: CheckInPayload) {
    const id = randomUUID();
    await this.tenantQuery(context, client => client.query(`INSERT INTO visits (id, tenant_id, location_id, kiosk_id, visit_type, first_name, last_name, phone, email, appointment_code, host_name, company, practice_area, opposing_party, notes, consent_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now())`, [id, context.tenantId, context.locationId, context.kioskId, payload.type, payload.firstName, payload.lastName, payload.phone || null, payload.email || null, payload.appointmentCode || null, payload.hostName || null, payload.company || null, payload.practiceArea || null, payload.opposingParty || null, payload.notes || null]));
    return { id, wait: payload.type === 'walk_in' ? 12 : 6 };
  }

  async dashboard(_tenantId: string): Promise<DashboardData> { throw new Error('Connect admin dashboard queries to your identity provider before enabling PostgreSQL admin mode.'); }
}
