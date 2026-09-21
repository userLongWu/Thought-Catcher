# Design

Preserve React hooks and the current Dexie schema. Reuse addThought/deleteThought/liveQuery. Keep mock output deterministic and visibly labelled. Manage focus and submission state within capture. Use confirmable per-record deletion and local error feedback. No new data layer, storage schema, packages, cloud service or real AI.

## Compatibility
Keep existing data and feature contracts. Use focused diffs and the existing test stack. Never reset user records. Changes remain local and reviewable.
