export interface AppointmentMatch { id: string; startsAt: string; hostName: string; status: string; }
export interface CrmAdapter {
  findAppointment(input: { tenantId: string; locationId: string; code?: string; name?: string; phone?: string }): Promise<AppointmentMatch | null>;
  markArrived(input: { tenantId: string; externalAppointmentId: string; arrivedAt: string }): Promise<void>;
  createLead(input: { tenantId: string; locationId: string; name: string; phone?: string; email?: string; practiceArea?: string }): Promise<{ externalId: string }>;
  uploadSignedForm(input: { tenantId: string; externalContactId: string; filename: string; bytes: Uint8Array }): Promise<void>;
}

export interface NotificationAdapter {
  notifyHost(input: { tenantId: string; locationId: string; hostName?: string; visitorName: string; visitType: string }): Promise<void>;
}

export type AliceEvent = 'visitor.checked_in' | 'form.signed' | 'walkin.alert' | 'visitor.seen';
