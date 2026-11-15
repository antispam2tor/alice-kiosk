WITH org AS (
  INSERT INTO organizations (name, slug, brand_color) VALUES ('Hartwell & Cole', 'hartwell-cole', '#18332f') RETURNING id
), loc AS (
  INSERT INTO locations (organization_id, name, timezone, address)
  SELECT id, 'Downtown Office', 'America/Chicago', '{"city":"Austin","region":"TX"}' FROM org RETURNING id, organization_id
), kiosk AS (
  INSERT INTO kiosks (tenant_id, location_id, name, status)
  SELECT organization_id, id, 'Main Lobby iPad', 'online' FROM loc RETURNING id
)
INSERT INTO device_activation_codes (kiosk_id, code_hash, expires_at)
SELECT id, encode(digest('482731', 'sha256'), 'hex'), now() + interval '30 days' FROM kiosk;
