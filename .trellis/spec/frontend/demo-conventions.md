# Local MVP conventions

Use existing React/TypeScript conventions and the current local persistence schema. No new dependencies. Keep loading, empty, error and success feedback next to the interaction. Disable duplicate writes. Preserve user data. Add behavior regression tests with the existing stack.

Validation: npm test; npm run lint; npm run build; npm run dev -- --host 127.0.0.1 --port 5174 --strictPort.

Ownership: root owns README, USER_GUIDE and .trellis; implementation agent owns application and test source.

Verified lessons: keep the active capture dialog accessible, focus trapped, and failure feedback inside the dialog. Use a unique browser origin for demo verification, preserve user IndexedDB, and restore temporary viewport settings. Mock AI must be disclosed beside its output.

Real AI uses same-origin endpoints backed by the local Node server. Never put provider secrets in VITE variables, browser state or backups. Capture offers explicit AI and manual actions; failures preserve input and never silently return mock content. Source edits invalidate old expressions; tag edits preserve provenance.

Keep Dexie schema v1 and add only optional record fields. Restore validates before one transaction, dedupes content before pre-restore ID conflicts, and assigns local IDs to new records. Untrusted backup IDs must not advance the key generator. Cancellation must remain wired until transaction settlement, not merely until its callback returns. Preserve unchanged tag arrays to avoid splitting stored commas.
