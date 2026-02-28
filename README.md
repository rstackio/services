# Services

A minimal TypeScript toolkit for async data fetching — typed error handling, chainable transforms, dev mocking, and SSR-compatible.

```ts
const getUser = createSafeProvider(api.getUser)
  .andMock(mock.getUser)
  .andThen((user) => ({ ...user, fullName: `${user.firstName} ${user.lastName}` }))
  .andCatch((error) => { logger.error('getUser failed', error); throw error; });

const [error, user] = await getUser(id, { signal });
```

---

## Modules

### `data-provider` — chainable async providers

Wraps async functions in a composable, type-safe API. Define transforms, error handling, and mocks once — they apply on every call.

- `createSafeProvider(fn)` — returns `[error, data]` tuples, never throws
- `createProvider(fn)` — standard Promise, throws on error
- `.andThen()` `.andCatch()` `.andFinally()` `.andMock()` — fluent chain

→ [API Reference](src/data-provider/docs/api.docs.mdx) · [Usage Guide](src/data-provider/docs/usage.docs.mdx)

---

### `safe` — errors as values

Wraps any function — sync or async — so it returns `[error, data]` instead of throwing. Error types are fully inferred.

- `safe(fn, [ErrorClass] as const)` — catches only the listed error types, rethrows others
- Works with synchronous and async functions

→ [API Reference](src/safe/docs/api.docs.mdx)

---

### `mock` — dev mocking utilities

Controls mock mode and provides a delay helper for simulating async behavior. SSR-compatible — uses `localStorage` in the browser and an in-memory store in Node/SSR.

- `enableMock()` / `disableMock()` — toggle mock mode (persists in browser)
- `isMockEnabled()` — `true` automatically in `test`, never in `production`
- `delay(fn, { delayMs, signal })` — simulate latency with abort support

→ [API Reference](src/mock/stories/api.docs.mdx) · [Usage Guide](src/mock/stories/usage.docs.mdx)

---

### `logger` — structured console logger

Color-coded, prefixed logger that silences itself in production automatically.

- Four levels: `info` `warn` `error` `debug`
- Per-module prefixes: `new Logger({ prefix: 'Auth' })`
- Silent when `NODE_ENV === 'production'` by default

→ [API Reference](src/logger/docs/api.docs.mdx) · [Usage Guide](src/logger/docs/usage.docs.mdx)

---

## Installation

```sh
npm install data-provider
pnpm add data-provider
yarn add data-provider
```

Requires **TypeScript 5.0+** with `strict: true`.

---

## Recommended structure

```
feature/
  api.ts        ← real async function
  mock.ts       ← mock using delay()
  provider.ts   ← createProvider(api).andMock(mock).andThen(normalize)
```

---

## Development

```sh
pnpm install
pnpm test          # run tests
pnpm test:watch    # watch mode
pnpm build         # build dist
```

## License

MIT
