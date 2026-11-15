import { randomUUID } from 'node:crypto';
import type { CheckInPayload, DashboardData, KioskConfig, VisitType } from '../src/types.js';
import type { DeviceContext, Repository } from './types.js';

const context: DeviceContext = { tenantId: 'tenant-hartwell', locationId: 'loc-downtown', kioskId: 'kiosk-lobby-01' };
const config: KioskConfig = { organizationName: 'Hartwell & Cole', locationName: 'Downtown Office', locationId: context.locationId, kioskId: context.kioskId, brandColor: '#18332f', welcomeMessage: 'How can we welcome you today?', appointmentCount: 8 };

type Visit = DashboardData['visits'][number];
const visits: Visit[] = [
  { id: 'v1', name: 'Maya Thompson', type: 'appointment', location: 'Downtown Office', host: 'Jordan Lee', checkedInAt: '9:42 AM', waitMinutes: 4, status: 'waiting' },
  { id: 'v2', name: 'Robert Chen', type: 'walk_in', location: 'Downtown Office', host: 'Intake team', checkedInAt: '9:35 AM', waitMinutes: 11, status: 'waiting' },
  { id: 'v3', name: 'Elena Ruiz', type: 'appointment', location: 'Northside Office', host: 'Sam Patel', checkedInAt: '9:31 AM', waitMinutes: 15, status: 'notified' },
  { id: 'v4', name: 'Marcus Webb', type: 'vendor', location: 'Westlake Office', host: 'Facilities', checkedInAt: '9:27 AM', waitMinutes: 19, status: 'waiting' },
];

export class MemoryRepository implements Repository {
  async activate(code: string) { return code === '482731' ? { context, config } : null; }
  async config(candidate: DeviceContext) { return candidate.tenantId === context.tenantId && candidate.kioskId === context.kioskId ? config : null; }
  async createCheckIn(_context: DeviceContext, payload: CheckInPayload) {
    const id = randomUUID(); const wait = payload.type === 'vendor' ? 2 : payload.type === 'walk_in' ? 12 : 6;
    visits.unshift({ id, name: `${payload.firstName} ${payload.lastName}`, type: payload.type as VisitType, location: config.locationName, host: payload.hostName || (payload.type === 'walk_in' ? 'Intake team' : 'Front desk'), checkedInAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), waitMinutes: 0, status: 'waiting' });
    return { id, wait };
  }
  async dashboard(_tenantId: string): Promise<DashboardData> {
    return {
      organizationName: 'Hartwell & Cole',
      stats: [
        { label: 'Check-ins today', value: '57', delta: '↑ 12% vs. last Sun' },
        { label: 'Currently waiting', value: String(Math.max(4, visits.filter(v => v.status === 'waiting').length)), delta: 'Across 3 locations' },
        { label: 'Average wait time', value: '8m 24s', delta: '↓ 2m this month' },
        { label: 'Walk-in conversion', value: '68%', delta: '↑ 5% this month' },
      ],
      locations: [
        { id: 'l1', name: 'Downtown Office', city: 'Austin, TX', waiting: 2, avgWait: 7, status: 'Online' },
        { id: 'l2', name: 'Northside Office', city: 'Round Rock, TX', waiting: 1, avgWait: 9, status: 'Online' },
        { id: 'l3', name: 'Westlake Office', city: 'West Lake Hills, TX', waiting: 1, avgWait: 6, status: 'Online' },
      ], visits,
      devices: [{ id: context.kioskId, name: 'Main Lobby iPad', location: 'Downtown Office', lastSeen: 'Just now', status: 'online' }],
      hourly: [4, 8, 13, 10, 20, 17, 24, 20, 28, 22, 16, 10],
    };
  }
}
