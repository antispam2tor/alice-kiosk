import type { CheckInPayload, DashboardData, KioskConfig } from '../src/types.js';

export interface DeviceContext { tenantId: string; locationId: string; kioskId: string; }
export interface Activation { context: DeviceContext; config: KioskConfig; }
export interface Repository {
  activate(code: string): Promise<Activation | null>;
  config(context: DeviceContext): Promise<KioskConfig | null>;
  createCheckIn(context: DeviceContext, payload: CheckInPayload): Promise<{ id: string; wait: number }>;
  dashboard(tenantId: string): Promise<DashboardData>;
}
