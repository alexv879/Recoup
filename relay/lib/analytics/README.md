# Analytics Event Emitter

Implements event emission, schema validation, privacy enforcement, offline/retry logic, and error handling for product analytics.

## Key Files
- `emitter.ts`: Main event emission logic
- `validate.ts`: Schema validation
- `transport.ts`: Event transport with offline/retry
- `types.ts`: TypeScript types
- `schemas/index.ts`: Event schemas
- `emitter.test.ts`: Basic tests

## Usage
```ts
import { emitEvent } from './emitter';
const result = await emitEvent({ type: 'signup_initiated', userId: 'u1', timestamp: Date.now() });
```
