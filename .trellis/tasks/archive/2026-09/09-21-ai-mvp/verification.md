# MVP verification — 2026-09-21

## Result

Implemented and independently reviewed the confirmed real-AI local MVP with data management. Existing Dexie schema v1 remains unchanged. No new package dependency; lockfile changes only add root Node engine metadata. No production deployment or GitHub push.

## Automated evidence

- `npm test`: 56/56 tests passed, including local HTTP contracts, capture, editing/cancellation, search and backup regressions.
- `npm run lint`: passed.
- `npm run build`: TypeScript and Vite passed; final ID-restore fix included.
- Independent review reran all 56 tests, type checking and targeted lint; no remaining blocking findings.
- `git diff --check`: passed; fixture credential absent from dist; `.env.local` ignored.
- Production server smoke: homepage, SPA and HEAD work; environment file is not served, traversal remains within dist, malicious Host is rejected, unconfigured generation returns 503.

## Actual browser verification

Used isolated origins `http://127.0.0.1:43178` (production + fixture) and `http://127.0.0.1:43179` (unconfigured dev). Synthetic records only; daily-use IndexedDB untouched.

- AI capture shows a pending state and saves English expressions, Chinese notes, tags and model provenance.
- Editing source clears stale generated content and marks it manual. Explicit regeneration restores AI expressions and retains manual tags.
- Search and tag content display work; refresh preserves records.
- Export through the UI downloads JSON. Native file selection restores it with 0 additions, 1 duplicate and 0 conflicts; both existing records remain.
- Fixture quota error preserves capture input. Save-original-only succeeds from the same failed form.
- Missing configuration shows setup guidance inside the capture panel and preserves input; manual capture then succeeds.
- Timeline, data toolbar and edit form visually checked at 390×844; viewport override reset afterward.

## Review repairs

- Unchanged tag input preserves tags containing commas.
- Cancellation remains active until Dexie transaction completion; abort before commit rolls back generation.
- Incoming IDs never drive IndexedDB's automatic key generator. Dedupe by content first, compare conflicts against the pre-restore local IDs, and allocate local IDs for new records. Regression covers maximum safe source ID → new capture → export → repeated and clean restore.

## Validation limits

No live provider key was supplied. The real HTTP path and failures were exercised against a deterministic local fixture, not a paid model service. Actual model availability and output quality remain unverified. Browser data stays tied to its origin/browser; static-only deployment cannot serve the local AI endpoints. No accounts, cloud sync or remote access are included.
