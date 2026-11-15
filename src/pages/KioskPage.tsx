import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarCheck, Check, ChevronRight, Clock3, LockKeyhole, Package, Sparkles, UserRoundPlus } from 'lucide-react';
import { clearDevice, getConfig, submitCheckIn } from '../api';
import { BrandMark } from '../components/BrandMark';
import type { CheckInPayload, CheckInResult, KioskConfig, VisitType } from '../types';

type Screen = 'home' | 'form' | 'success';
const emptyForm: CheckInPayload = { type: 'appointment', firstName: '', lastName: '', phone: '', email: '', appointmentCode: '', hostName: '', company: '', practiceArea: '', opposingParty: '', notes: '', consent: false };

const choices = [
  { type: 'appointment' as const, icon: CalendarCheck, title: 'I have an appointment', text: 'Check in for a scheduled visit' },
  { type: 'walk_in' as const, icon: UserRoundPlus, title: 'New client inquiry', text: 'Tell us how we can help' },
  { type: 'vendor' as const, icon: Package, title: 'Delivery or vendor', text: 'Notify a team member' },
];

export function KioskPage() {
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [form, setForm] = useState<CheckInPayload>(emptyForm);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { getConfig().then(setConfig).catch(() => { location.href = '/activate'; }); }, []);
  useEffect(() => {
    if (screen === 'home') return;
    const timer = setTimeout(reset, screen === 'success' ? 12000 : 120000);
    return () => clearTimeout(timer);
  }, [screen]);

  function begin(type: VisitType) { setForm({ ...emptyForm, type }); setError(''); setScreen('form'); }
  function update(key: keyof CheckInPayload, value: string | boolean) { setForm(current => ({ ...current, [key]: value })); }
  function reset() { setForm(emptyForm); setResult(null); setError(''); setScreen('home'); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try { const response = await submitCheckIn(form); setResult(response); setScreen('success'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to check in.'); }
    finally { setLoading(false); }
  }

  if (!config) return <div className="loading-screen"><Sparkles className="pulse" /><span>Preparing your check-in…</span></div>;

  return (
    <main className="kiosk-shell" style={{ '--brand': config.brandColor } as React.CSSProperties}>
      <header className="kiosk-header"><BrandMark /><div><span className="status-dot" /> {config.locationName}</div></header>
      {screen === 'home' && (
        <section className="kiosk-home">
          <div className="kiosk-intro"><span className="eyebrow">Welcome to {config.organizationName}</span><h1>{config.welcomeMessage}</h1><p>Choose an option below. It only takes a moment.</p></div>
          <div className="visit-choices">
            {choices.map(({ type, icon: Icon, title, text }) => (
              <button key={type} onClick={() => begin(type)} className="visit-choice">
                <span className="visit-choice__icon"><Icon size={29} /></span><span><strong>{title}</strong><small>{text}</small></span><ChevronRight />
              </button>
            ))}
          </div>
          <div className="privacy-line"><LockKeyhole size={15} /> Your information is private and cleared after check-in.</div>
        </section>
      )}
      {screen === 'form' && <CheckInForm form={form} update={update} onBack={reset} onSubmit={submit} loading={loading} error={error} />}
      {screen === 'success' && result && (
        <section className="success-card">
          <div className="success-icon"><Check size={36} /></div><span className="eyebrow">Check-in complete</span>
          <h1>Thank you, {result.firstName}.</h1><p>{result.message}</p>
          <div className="wait-card"><Clock3 /><span><small>Estimated wait</small><strong>{result.estimatedWaitMinutes}–{result.estimatedWaitMinutes + 5} minutes</strong></span></div>
          <button className="secondary-button" onClick={reset}>Done</button><small className="auto-reset">This screen will clear automatically.</small>
        </section>
      )}
      <footer className="kiosk-footer"><span>Powered by <strong>Alice</strong></span><button onClick={async () => { if (confirm('Unpair this kiosk?')) { await clearDevice(); location.href = '/activate'; } }}>Device settings</button></footer>
    </main>
  );
}

function CheckInForm({ form, update, onBack, onSubmit, loading, error }: { form: CheckInPayload; update: (key: keyof CheckInPayload, value: string | boolean) => void; onBack: () => void; onSubmit: (e: FormEvent) => void; loading: boolean; error: string }) {
  const appointment = form.type === 'appointment'; const walkin = form.type === 'walk_in';
  const heading = appointment ? 'Find your appointment' : walkin ? 'New client inquiry' : 'Delivery or vendor check-in';
  return (
    <section className="form-screen">
      <button className="back-button" onClick={onBack}><ArrowLeft size={19} /> Back</button>
      <div className="form-card"><span className="eyebrow">{appointment ? 'Scheduled visit' : walkin ? 'Walk-in' : 'Guest visit'}</span><h1>{heading}</h1><p className="form-lede">Enter a few details so the right person can meet you.</p>
        <form onSubmit={onSubmit}>
          <div className="field-row"><Field label="First name" value={form.firstName} onChange={v => update('firstName', v)} required /><Field label="Last name" value={form.lastName} onChange={v => update('lastName', v)} required /></div>
          {appointment && <Field label="Appointment or QR code (optional)" value={form.appointmentCode ?? ''} onChange={v => update('appointmentCode', v)} placeholder="Example: ALC-1842" />}
          {walkin && <><label className="field"><span>What can we help with?</span><select value={form.practiceArea} onChange={e => update('practiceArea', e.target.value)} required><option value="">Choose a practice area</option><option>Family law</option><option>Criminal defense</option><option>Estate planning</option><option>Personal injury</option><option>Other</option></select></label><Field label="Other party or people involved" value={form.opposingParty ?? ''} onChange={v => update('opposingParty', v)} placeholder="For a confidential conflict check" /></>}
          {form.type === 'vendor' && <div className="field-row"><Field label="Company" value={form.company ?? ''} onChange={v => update('company', v)} required /><Field label="Person you are visiting" value={form.hostName ?? ''} onChange={v => update('hostName', v)} /></div>}
          <div className="field-row"><Field label="Mobile number" value={form.phone ?? ''} onChange={v => update('phone', v)} type="tel" placeholder="(555) 000-0000" required={walkin} /><Field label="Email (optional)" value={form.email ?? ''} onChange={v => update('email', v)} type="email" /></div>
          {walkin && <label className="field"><span>Brief description (optional)</span><textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Please do not include sensitive or urgent details." /></label>}
          <label className="consent"><input type="checkbox" checked={form.consent} onChange={e => update('consent', e.target.checked)} required /><span>I confirm these details are accurate. Checking in does not create an attorney-client relationship.</span></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={loading}>{loading ? 'Checking you in…' : 'Complete check-in'} <ArrowRight size={18} /></button>
        </form>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, required, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} /></label>;
}
