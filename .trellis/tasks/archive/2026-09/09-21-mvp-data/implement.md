# Execution

1. Independently review this scope, integration contracts and failure boundaries.
2. Add regression tests at data/API boundaries, then implement in the assigned ownership lanes.
3. Integrate and update README/config examples; never add real credentials.
4. Validate: npm test; npm run lint; npm run build; Node backend tests; npm start production smoke.
5. Exercise the actual UI using isolated synthetic data and a deterministic local HTTP fixture; verify unconfigured and failure states.
6. Independent code review, fix findings, rerun relevant checks.
7. Record evidence and explicit live-service limitations, create local scoped commits, archive tasks; do not push.
