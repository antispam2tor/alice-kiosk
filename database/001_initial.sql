CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  brand_color text NOT NULL DEFAULT '#18332f',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  timezone text NOT NULL,
  address jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE kiosks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online','offline','disabled')),
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device_activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_id uuid NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE visits (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  kiosk_id uuid REFERENCES kiosks(id) ON DELETE SET NULL,
  visit_type text NOT NULL CHECK (visit_type IN ('appointment','walk_in','vendor')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  appointment_code text,
  host_name text,
  company text,
  practice_area text,
  opposing_party text,
  notes text,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','notified','seen','cancelled')),
  consent_at timestamptz NOT NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  seen_at timestamptz
);

CREATE TABLE form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL, version integer NOT NULL DEFAULT 1, schema jsonb NOT NULL, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (tenant_id, title, version)
);

CREATE TABLE webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  endpoint_url text NOT NULL, event_types text[] NOT NULL, signing_secret_ciphertext text NOT NULL,
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX visits_tenant_location_time ON visits (tenant_id, location_id, checked_in_at DESC);
CREATE INDEX visits_waiting ON visits (tenant_id, location_id, status) WHERE status = 'waiting';
CREATE UNIQUE INDEX activation_code_active ON device_activation_codes(code_hash) WHERE used_at IS NULL;

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY locations_tenant_isolation ON locations USING (organization_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY kiosks_tenant_isolation ON kiosks USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY visits_tenant_isolation ON visits USING (tenant_id = current_setting('app.tenant_id', true)::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY forms_tenant_isolation ON form_templates USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY webhooks_tenant_isolation ON webhook_subscriptions USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Kiosk routes also set app.location_id and must always include location_id in queries.
-- Use a separate, non-owner database role in production so RLS cannot be bypassed.
