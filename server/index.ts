import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { MemoryRepository } from './memory-repository.js';
import { PostgresRepository } from './postgres-repository.js';
import type { DeviceContext } from './types.js';

const port = Number(process.env.PORT || 8787);
const secretText = process.env.JWT_SECRET || 'demo-only-secret-change-before-production-123';
if (process.env.NODE_ENV === 'production' && secretText.startsWith('demo-only')) throw new Error('JWT_SECRET must be set in production.');
const secret = new TextEncoder().encode(secretText);
const repository = process.env.DATABASE_URL ? new PostgresRepository(process.env.DATABASE_URL) : new MemoryRepository();
const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.APP_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '64kb' }));

const activationSchema = z.object({ code: z.string().regex(/^\d{6}$/) });
const checkInSchema = z.object({
  type: z.enum(['appointment', 'walk_in', 'vendor']), firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80),
  phone: z.string().max(30).optional(), email: z.string().email().max(160).or(z.literal('')).optional(), appointmentCode: z.string().max(60).optional(),
  hostName: z.string().max(100).optional(), company: z.string().max(120).optional(), practiceArea: z.string().max(100).optional(), opposingParty: z.string().max(200).optional(), notes: z.string().max(1000).optional(), consent: z.literal(true),
});

async function deviceAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(part => { const [key, ...value] = part.trim().split('='); return [key, decodeURIComponent(value.join('='))]; }));
    const token = req.headers.authorization?.replace(/^Bearer /, '') || cookies.alice_device; if (!token) throw new Error('missing');
    const { payload } = await jwtVerify(token, secret, { issuer: 'alice-kiosk', audience: 'alice-device' });
    res.locals.device = { tenantId: payload.tenantId, locationId: payload.locationId, kioskId: payload.sub } as DeviceContext; next();
  } catch { res.status(401).json({ error: 'This kiosk needs to be paired again.' }); }
}

app.get('/health', (_req, res) => res.json({ status: 'ok', mode: process.env.DATABASE_URL ? 'postgres' : 'demo' }));
app.post('/api/devices/activate', async (req, res, next) => {
  try { const { code } = activationSchema.parse(req.body); const activation = await repository.activate(code); if (!activation) return res.status(404).json({ error: 'That pairing code is invalid or expired.' });
    const token = await new SignJWT({ tenantId: activation.context.tenantId, locationId: activation.context.locationId }).setProtectedHeader({ alg: 'HS256' }).setSubject(activation.context.kioskId).setIssuer('alice-kiosk').setAudience('alice-device').setIssuedAt().setExpirationTime('30d').sign(secret);
    res.cookie('alice_device', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/' });
    res.json({ config: activation.config });
  } catch (error) { next(error); }
});
app.post('/api/devices/unpair', (_req, res) => { res.clearCookie('alice_device', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' }); res.json({ ok: true }); });
app.get('/api/kiosk/config', deviceAuth, async (_req, res) => { const config = await repository.config(res.locals.device); if (!config) return res.status(404).json({ error: 'Kiosk not found.' }); res.json(config); });
app.post('/api/kiosk/check-ins', deviceAuth, async (req, res, next) => {
  try { const payload = checkInSchema.parse(req.body); const result = await repository.createCheckIn(res.locals.device, payload); res.status(201).json({ id: result.id, firstName: payload.firstName, status: 'notified', message: payload.type === 'vendor' ? 'We’ve notified the front desk. Someone will meet you shortly.' : 'You’re checked in. Please have a seat and a team member will be with you shortly.', estimatedWaitMinutes: result.wait }); }
  catch (error) { next(error); }
});
app.get('/api/admin/dashboard', async (req, res) => { if (req.headers['x-admin-token'] !== (process.env.ADMIN_TOKEN || 'alice-demo-admin')) return res.status(401).json({ error: 'Unauthorized' }); res.json(await repository.dashboard('tenant-hartwell')); });

const root = path.dirname(fileURLToPath(import.meta.url)); const publicDir = path.resolve(root, '../dist/public');
app.use(express.static(publicDir));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) return res.sendFile(path.join(publicDir, 'index.html'));
  next();
});
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Invalid form data.' }); console.error(error); res.status(500).json({ error: 'We could not complete that request.' }); });
app.listen(port, () => console.log(`Alice API listening on http://localhost:${port}`));
