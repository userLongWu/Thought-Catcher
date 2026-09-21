# Thought Catcher: demonstrable demo

## Approved goal
The user selected: improve both demos, fix defects, complete interactions and documentation, retain mock AI. Requirements are confirmed; no product decision blocks implementation.

## Acceptance
1. A visible new-thought button can reopen capture after save/close on desktop and touch screens.
2. Capture has labelled input, submit/close controls, Escape and Ctrl/Cmd+K, appropriate focus management and IME-safe Enter handling.
3. Save failures appear inside the panel, preserve input for retry and do not allow double submission.
4. The app and result cards clearly label mock output instead of claiming real translation.
5. A saved record can be deleted through deliberate confirmation; loading/error/empty states and persistence still work.
6. A newcomer can follow verified install/run instructions and a short demonstration.
7. Existing local data is preserved. No schema migration, real AI, new dependency, account, cloud sync, deployment or GitHub push.

## Task tree
- demo-flow: application fixes and regression tests, owned by the implementation agent.
- demo-docs: README.md, owned by root; final wording depends on verified demo-flow behavior.
- Parent: final integration review and desktop/browser smoke verification.
The two repositories are independent.
