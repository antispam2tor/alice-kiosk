import type { CheckInPayload, CheckInResult, DashboardData, KioskConfig } from './types';

const staticDemo = import.meta.env.VITE_STATIC_DEMO === 'true';
const demoConfig: KioskConfig = { organizationName: 'Hartwell & Cole', locationName: 'Downtown Office', locationId: 'loc-downtown', kioskId: 'kiosk-lobby-01', brandColor: '#18332f', welcomeMessage: 'How can we welcome you today?', appointmentCount: 8 };
const demoDashboard: DashboardData = {
  organizationName: 'Hartwell & Cole',
  stats: [
    { label: 'Check-ins today', value: '57', delta: '↑ 12% vs. last Sun' },
    { label: 'Currently waiting', value: '4', delta: 'Across 3 locations' },
    { label: 'Average wait time', value: '8m 24s', delta: '↓ 2m this month' },
    { label: 'Walk-in conversion', value: '68%', delta: '↑ 5% this month' },
  ],
  locations: [
    { id: 'l1', name: 'Downtown Office', city: 'Austin, TX', waiting: 2, avgWait: 7, status: 'Online' },
    { id: 'l2', name: 'Northside Office', city: 'Round Rock, TX', waiting: 1, avgWait: 9, status: 'Online' },
    { id: 'l3', name: 'Westlake Office', city: 'West Lake Hills, TX', waiting: 1, avgWait: 6, status: 'Online' },
  ],
  visits: [
    { id: 'v1', name: 'Maya Thompson', type: 'appointment', location: 'Downtown Office', host: 'Jordan Lee', checkedInAt: '9:42 AM', waitMinutes: 4, status: 'waiting' },
    { id: 'v2', name: 'Robert Chen', type: 'walk_in', location: 'Downtown Office', host: 'Intake team', checkedInAt: '9:35 AM', waitMinutes: 11, status: 'waiting' },
    { id: 'v3', name: 'Elena Ruiz', type: 'appointment', location: 'Northside Office', host: 'Sam Patel', checkedInAt: '9:31 AM', waitMinutes: 15, status: 'notified' },
    { id: 'v4', name: 'Marcus Webb', type: 'vendor', location: 'Westlake Office', host: 'Facilities', checkedInAt: '9:27 AM', waitMinutes: 19, status: 'waiting' },
  ],
  devices: [{ id: 'kiosk-lobby-01', name: 'Main Lobby iPad', location: 'Downtown Office', lastSeen: 'Just now', status: 'online' }],
  hourly: [4, 8, 13, 10, 20, 17, 24, 20, 28, 22, 16, 10],
};

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
  if (staticDemo) {
    if (code !== '482731') throw new Error('That pairing code is invalid or expired.');
    return demoConfig;
  }
  const result = await request<{ config: KioskConfig }>('/api/devices/activate', {
    method: 'POST', body: JSON.stringify({ code }),
  });
  return result.config;
}

export const getConfig = () => staticDemo ? Promise.resolve(demoConfig) : request<KioskConfig>('/api/kiosk/config');
export const submitCheckIn = (payload: CheckInPayload): Promise<CheckInResult> => staticDemo
  ? Promise.resolve({ id: crypto.randomUUID(), firstName: payload.firstName, status: 'notified', message: payload.type === 'vendor' ? 'We’ve notified the front desk. Someone will meet you shortly.' : 'You’re checked in. Please have a seat and a team member will be with you shortly.', estimatedWaitMinutes: payload.type === 'walk_in' ? 12 : 6 })
  : request<CheckInResult>('/api/kiosk/check-ins', { method: 'POST', body: JSON.stringify(payload) });
export const getDashboard = () => staticDemo ? Promise.resolve(demoDashboard) : request<DashboardData>('/api/admin/dashboard', { headers: { 'x-admin-token': 'alice-demo-admin' } });
export const clearDevice = () => staticDemo ? Promise.resolve({ ok: true }) : request<{ ok: boolean }>('/api/devices/unpair', { method: 'POST' });
