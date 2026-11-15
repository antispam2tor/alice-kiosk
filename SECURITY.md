# Security policy

Do not report vulnerabilities in public issues. Contact the repository owner privately with reproduction steps, affected versions, and impact.

## Current boundary

The seeded demo is for product evaluation only. It uses a public pairing code, an in-memory data store, and a demonstration admin token. Never enter real legal, medical, financial, or identifying information into demo mode.

PostgreSQL mode establishes the intended tenant-isolation mechanism, but a production release still requires real workforce identity, authorization roles, key management, audit retention, operational controls, and an independent security review. HIPAA compliance is an organizational program and cannot be guaranteed by source code alone.

## Supported versions

Until version 1.0, only the latest commit on the default branch receives security fixes.
