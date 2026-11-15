import type { CheckInPayload, CheckInResult, DashboardData, KioskConfig } from './types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? 'Something went wrong. Please try again.');
  return body as T;
}

export async function activateDevice(code: string) {
  const result = await request<{ config: KioskConfig }>('/api/devices/activate', {
    method: 'POST', body: JSON.stringify({ code }),
  });
  return result.config;
}

export const getConfig = () => request<KioskConfig>('/api/kiosk/config');
export const submitCheckIn = (payload: CheckInPayload) => request<CheckInResult>('/api/kiosk/check-ins', { method: 'POST', body: JSON.stringify(payload) });
export const getDashboard = () => request<DashboardData>('/api/admin/dashboard', { headers: { 'x-admin-token': 'alice-demo-admin' } });
export const clearDevice = () => request<{ ok: boolean }>('/api/devices/unpair', { method: 'POST' });
