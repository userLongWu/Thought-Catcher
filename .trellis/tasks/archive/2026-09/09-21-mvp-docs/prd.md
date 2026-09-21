# Real AI local MVP

## Confirmed scope
User selected real-AI single-user local MVP, using configurable OpenAI-compatible endpoints with local base URL, model and API key. No accounts, cloud sync, public deployment or GitHub push. No new package dependencies. Preserve all existing data.

## Shared acceptance
- Backend-only provider calls using AI_BASE_URL, AI_MODEL, AI_API_KEY from local environment; .env.local is ignored and never exported. Frontend only receives enabled/model status, never the key.
- Minimum Chat Completions contract (model/messages, choices[0].message.content), finite timeout and bounded payloads, no automatic retries, no silent mock fallback. HTTPS endpoints; HTTP only for explicit loopback endpoints. Disable redirects to avoid credential forwarding.
- Missing configuration, bad key, rate/quota limits, malformed output and timeout produce actionable errors without raw provider payloads. Original user input stays available.
- Versioned JSON backups validate entirely before writes; restore merges into existing data, preserves conflicting records and never wipes the database. Credentials are excluded.
- Targeted regressions, build/type checks, independent review and actual browser/native UI verification are required. Live external API validation depends on a user-configured key; contract tests must be explicitly described as local fixtures.
## Product acceptance
- New thought capture has explicit real-AI and save-original-only actions. Real AI returns casual/formal English, Chinese notes and tags; a plain record remains useful when no service is configured. No fake output on the real-AI path.
- Existing legacy records are labeled mock; AI/manual/edited provenance is accurate. Optional generationMode, generationModel and updatedAt fields must not require a Dexie schema migration.
- Search all saved thought text and tags; filter by tag; edit text/tags safely; regenerate expressions on explicit user action. Preserve creation date and identity when editing. If original text changes, discard outdated generated fields or require explicit regeneration rather than displaying them as current.
- Versioned JSON backup/download and selected-file merge restore with strict validation, Date reconstruction, conflict/duplicate handling, transaction rollback and no current-record replacement.
- Dev and production local start commands work with a backend proxy, and the browser never sends requests directly to the provider or sees its key.
