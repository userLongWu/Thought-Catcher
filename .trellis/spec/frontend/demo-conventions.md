# Demo conventions

Use existing React/TypeScript conventions and the current local persistence schema. No new dependencies. Keep loading, empty, error and success feedback next to the interaction. Disable duplicate writes. Preserve user data. Add behavior regression tests with the existing stack.

Validation: npm test; npm run lint; npm run build; npm run dev -- --host 127.0.0.1 --port 5174 --strictPort.

Ownership: root owns README, USER_GUIDE and .trellis; implementation agent owns application and test source.

Verified lessons: keep the active capture dialog accessible, focus trapped, and failure feedback inside the dialog. Use a unique browser origin for demo verification, preserve user IndexedDB, and restore temporary viewport settings. Mock AI must be disclosed beside its output.
