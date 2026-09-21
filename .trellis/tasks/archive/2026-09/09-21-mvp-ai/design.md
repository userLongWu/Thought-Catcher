# Design

## Ownership and contracts
Root owns server/**, vite.config.ts, package.json scripts (no package changes), .env.example, .gitignore, src/lib/aiClient.ts, src/App.tsx, src/components/CommandPalette.tsx, src/components/AiSettings.tsx, src/hooks/useThoughtCapture.ts, README and .trellis. Data executor owns src/db/database.ts + tests, src/components/ThoughtCard.tsx, TimelineView.tsx, new DataTools/editor components and backup/filter libraries/tests. Do not alter shared files without coordination.
Record additions: generationMode?: 'ai' | 'manual' | 'mock'; generationModel?: string; updatedAt?: Date. Legacy absence means mock. Reuse schema v1; indexes unchanged.
Root exports generateExpressions(text: string, signal?: AbortSignal): Promise<{translatedCasual:string;translatedFormal:string;grammarNotes:string;tags:string[];model:string}> from src/lib/aiClient.ts. It calls same-origin POST /api/generate with {text}. GET /api/ai-status returns {configured:boolean, model:string|null}. API errors are user-readable Error objects; requests are finite and cancellable. No implicit retry/fallback.
Data executor may import generateExpressions for per-record explicit regeneration, guarding stale edits and duplicate calls. On original edit, clear old generated output and mark manual. Tags-only edit preserves provenance. TimelineView owns its data/search/filter/backup toolbar so App integration remains minimal.
Node backend uses built-in http/fs/fetch, local env config and loopback binding. Dev Vite middleware and production static server share the same handler. Reject untrusted Host/Origin, unsupported methods/content types, oversized body, malformed provider response; no raw provider error logging. Production serves only files under dist with SPA routing.

## Official API evidence
- https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
- https://developers.openai.com/api/reference/overview
- https://developers.openai.com/api/docs/guides/error-codes
