# data-provider

Minimal TypeScript toolkit for async data fetching — typed errors, chainable transforms, zero-config mocking.

```ts
const getUser = createSafeProvider(api.getUser)
  .andMock(mock.getUser)
  .andThen((user) => ({ ...user, fullName: `${user.firstName} ${user.lastName}` }))
  .andCatch((error) => { logger.error('getUser failed', error); throw error; });

const [error, user] = await getUser(id, { signal });
```

---

## Modules

| Module | Purpose |
|--------|---------|
| [`data-provider`](src/data-provider/docs/api.docs.mdx) | Wrap async functions in a chainable, mockable, type-safe API |
| [`mock`](src/mock/docs/api.docs.mdx) | Toggle mock mode, simulate latency, SSR-compatible state |
| [`safe`](src/safe/docs/api.docs.mdx) | Wrap any function to return `[error, data]` instead of throwing |
| [`logger`](src/logger/docs/api.docs.mdx) | Structured console logger, silent in production |

---

## Key features

- **`[error, data]` tuples** — `createSafeProvider` never throws; errors are typed values
- **Chainable API** — `.andMock()` `.andThen()` `.andCatch()` `.andFinally()` compose once, apply on every call
- **Zero-config testing** — mocks activate automatically in `NODE_ENV=test`; swap them per test with `.andMock()`
- **Dev mocking** — toggle mocks from the browser console without touching source code
- **Abort support** — `AbortSignal` flows through providers and `delay()` helpers

---

## File structure

Each feature module owns its data layer in a `data-provider/` folder:

```
src/
  modules/
    user/
      data-provider/
        api.ts        ← real async function
        mock.ts       ← mock using delay()
        provider.ts   ← createProvider(api).andMock(mock).andThen(normalize)
        index.ts      ← export * from './provider'
```

Consume anywhere in the module:

```ts
import * as Dp from './data-provider';

const [error, user] = await Dp.getUser(id);
```

---

## Installation

```sh
npm install data-provider
pnpm add data-provider
yarn add data-provider
```

Requires **TypeScript 5.0+** with `strict: true`.

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
