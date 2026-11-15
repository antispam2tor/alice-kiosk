export type VisitType = 'appointment' | 'walk_in' | 'vendor';

export interface KioskConfig {
  organizationName: string;
  locationName: string;
  locationId: string;
  kioskId: string;
  brandColor: string;
  welcomeMessage: string;
  appointmentCount: number;
}

export interface CheckInPayload {
  type: VisitType;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  appointmentCode?: string;
  hostName?: string;
  company?: string;
  practiceArea?: string;
  opposingParty?: string;
  notes?: string;
  consent: boolean;
}

export interface CheckInResult {
  id: string;
  firstName: string;
  status: 'waiting' | 'notified';
  message: string;
  estimatedWaitMinutes: number;
}

export interface DashboardData {
  organizationName: string;
  stats: { label: string; value: string; delta: string }[];
  locations: { id: string; name: string; city: string; waiting: number; avgWait: number; status: string }[];
  visits: { id: string; name: string; type: VisitType; location: string; host: string; checkedInAt: string; waitMinutes: number; status: string }[];
  devices: { id: string; name: string; location: string; lastSeen: string; status: string }[];
  hourly: number[];
}
