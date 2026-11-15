import { FormEvent, useState } from 'react';
import { ArrowRight, Check, MonitorSmartphone, ShieldCheck, Wifi } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { activateDevice } from '../api';
import { BrandMark } from '../components/BrandMark';

export function ActivatePage() {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (digits.length !== 6) return setError('Enter the six-digit code from the admin portal.');
    setLoading(true); setError('');
    try { await activateDevice(digits); navigate('/kiosk'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Activation failed.'); }
    finally { setLoading(false); }
  }

  return (
    <main className="activation-shell">
      <section className="activation-story">
        <BrandMark inverse />
        <div className="activation-copy">
          <span className="eyebrow eyebrow--light">Secure lobby experience</span>
          <h1>Welcome people well.<br />Keep every office in sync.</h1>
          <p>A private, touch-friendly check-in built for professional services teams.</p>
          <div className="feature-list">
            <div><span><ShieldCheck /></span><p><strong>Tenant-isolated</strong><small>Every device is bound to one office.</small></p></div>
            <div><span><Wifi /></span><p><strong>Always current</strong><small>Updates reach every lobby instantly.</small></p></div>
            <div><span><MonitorSmartphone /></span><p><strong>Bring your own device</strong><small>Works on tablets and touchscreens.</small></p></div>
          </div>
        </div>
        <p className="activation-footnote"><Check size={15} /> Encrypted connection · Private by design</p>
      </section>
      <section className="activation-panel">
        <div className="activation-card">
          <span className="step-pill">Device setup · 1 of 1</span>
          <h2>Pair this kiosk</h2>
          <p>In the Alice admin portal, choose a location and select <strong>Add kiosk</strong>. Enter the code shown there.</p>
          <form onSubmit={submit}>
            <label htmlFor="pairing-code">Six-digit pairing code</label>
            <input id="pairing-code" className="code-input" inputMode="numeric" autoComplete="one-time-code" autoFocus
              placeholder="000 000" value={digits.replace(/(\d{3})(\d+)/, '$1 $2')}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={loading || digits.length !== 6}>
              {loading ? 'Pairing…' : 'Pair kiosk'} <ArrowRight size={18} />
            </button>
          </form>
          <p className="demo-note">Trying the demo? Use code <button type="button" onClick={() => setDigits('482731')}>482 731</button>.</p>
        </div>
        <Link to="/admin" className="admin-link">Open admin demo <ArrowRight size={14} /></Link>
      </section>
    </main>
  );
}
