# Cognivue Backend — Local Telemetry Aggregator

This directory serves as the future home of the Cognivue local server. 

## Planned Tech Stack
- **Server Core**: Node.js (with Express/Fastify) or Python (with FastAPI)
- **Local Persistence**: SQLite / PostgreSQL (local instances) for low-overhead secure storage
- **API Architecture**: WebSocket connections for streaming realtime gaze telemetry and REST endpoints for raw session reporting

## Planned Features
1. **Realtime Aggregation**: Synchronizes facial blink counts and posture alerts streaming from the local client.
2. **Session Persistence**: Saves deep-work logs, focus periods, and productivity scores, allowing user history lookup on the `/sessions` page.
3. **Privacy Gateway**: Encrypts and filters all processed metrics before sync.

---
*Created as a placeholder inside the Cognivue monorepo architecture.*
