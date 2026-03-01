# Services

> Minimal TypeScript toolkit for async data fetching —
> typed errors, chainable transforms, zero-config mocking.

<p align="center">
  <a href="https://www.npmjs.com/package/@rstackio/services"><img src="https://img.shields.io/npm/v/@rstackio/services" alt="npm" /></a>
  <a href="https://github.com/rstackio/services/actions/workflows/publish.yml"><img src="https://github.com/rstackio/services/actions/workflows/publish.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/rstackio/services/actions/workflows/publish.yml"><img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/rkovalov/c73854c806277dbac2ab2b6936c39518/raw/coverage.json" alt="coverage" /></a>
  <a href="https://github.com/rstackio/services/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0%2B-blue" alt="TypeScript" /></a>
</p>

---

## 💡 Philosophy

Most async data layers grow into a tangle of try/catch blocks, ad-hoc mocks, and one-off error handling scattered across components. **Services** is built to fix that at the source — the main goal is to make async data work feel smooth and predictable, so developers spend less time on plumbing and more time building features.

A few guiding principles:

- **Errors are values, not exceptions.** `[error, data]` tuples make error handling explicit and type-safe — no surprises, no forgotten catch blocks.
- **Define once, run everywhere.** Transforms, error handlers, and mocks are declared on the provider, not at every call site. Change behavior in one place.
- **Mocking should cost nothing.** Tests and dev mode use real mock files — no framework magic, no `vi.mock` gymnastics. Toggle from the console, swap per test with `.andMock()`.
- **No hidden abstractions.** The provider is just a function. `await getUser(id)` — it does exactly what you'd expect.
- **Colocation over convention.** Each feature owns its `api`, `mock`, `normalize`, and `provider` files. The data layer lives next to the feature that uses it.

---

## ✨ Features

- 🛡️ **`[error, data]` tuples** — `createSafeProvider` never throws; errors are typed values
- 🔗 **Chainable API** — `.andMock()` `.andThen()` `.andCatch()` `.andFinally()` compose once, apply on every call
- 🧪 **Zero-config testing** — mocks activate automatically in `NODE_ENV=test`; swap them per test with `.andMock()`
- 🎭 **Dev mocking** — toggle mocks from the browser console without touching source code
- ⚡ **Abort support** — `AbortSignal` flows through providers and `delay()` helpers

---

## 📦 Modules

| Module | Purpose | Docs |
|--------|---------|------|
| `data-provider` | Wrap async functions in a chainable, mockable, type-safe API | [API](https://github.com/rstackio/services/blob/main/src/data-provider/docs/api.docs.mdx) · [Usage](https://github.com/rstackio/services/blob/main/src/data-provider/docs/usage.docs.mdx) |
| `mock` | Toggle mock mode, simulate latency, SSR-compatible state | [API](https://github.com/rstackio/services/blob/main/src/mock/docs/api.docs.mdx) · [Usage](https://github.com/rstackio/services/blob/main/src/mock/docs/usage.docs.mdx) |
| `safe` | Wrap any function to return `[error, data]` instead of throwing | [API](https://github.com/rstackio/services/blob/main/src/safe/docs/api.docs.mdx) |
| `logger` | Structured console logger, silent in production | [API](https://github.com/rstackio/services/blob/main/src/logger/docs/api.docs.mdx) · [Usage](https://github.com/rstackio/services/blob/main/src/logger/docs/usage.docs.mdx) |

---

## 🗂️ File structure

This is a suggested folder structure — not enforced by the library. Use whatever layout fits your project. The pattern that works well in practice:

```
src/
└── modules/
    └── user/
        ├── models/
        │   └── user.model.ts      ← types and validation schema, API and UI models
        └── data-provider/
            ├── api.ts             ← real async function
            ├── mock.ts            ← mock using delay()
            ├── normalize.ts       ← pure function to transform API response to UI model
            ├── provider.ts        ← wires api, mock and transforms together; also a natural place for React Query options
            └── index.ts           ← export * from './provider'
```

**`api.ts`** — fetch from real endpoint
```ts
import ky from 'ky';
import { userApiSchema } from '../models/user.model';

export const getUser = (id: string, signal?: AbortSignal) =>
  ky.get(`/api/users/${id}`, { signal }).json(userApiSchema);
```

> `ky` can be extended to add runtime schema validation — keeping individual `api.ts` files clean while ensuring runtime types always match build-time types.

**`mock.ts`** — simulated response with realistic delay
```ts
import { delay } from '@rstackio/services/mock';

export const getUser = (id: string, signal?: AbortSignal) =>
  delay(() => ({ id, firstName: 'Jane', lastName: 'Doe', role: 'admin' as const }), { signal, delayMs: 300 });
```

**`normalize.ts`** — pure transform, easy to test in isolation
```ts
import type { UserApi, User } from '../models/user.model';

export const normalize = (user: UserApi): User => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`,
});
```

**`provider.ts`** — wires everything together once
```ts
import { createSafeProvider } from '@rstackio/services/data-provider';
import * as api from './api';
import * as mock from './mock';
import { normalize } from './normalize';

export const getUser = createSafeProvider(api.getUser)
  .andMock(mock.getUser) // ✅ mock must match the exact signature of api.getUser
  .andThen(normalize);   // ✅ final type is inferred from normalize's return type — callers get User, not UserApi
```

> **Type safety** — `.andMock()` enforces that the mock matches the original signature. `.andThen()` transforms the result type — the caller always sees the output of the last transform, fully inferred with no manual annotations needed.

**`index.ts`** — single public entry point
```ts
export * from './provider';
```

Consume anywhere in the module:

```ts
import * as Dp from './data-provider';

const [error, user] = await Dp.getUser(id);
```

---

## 🚀 Installation

```sh
npm install @rstackio/services
# or
pnpm add @rstackio/services
# or
yarn add @rstackio/services
```

Requires **TypeScript 5.0+** with `strict: true`.

---

## 🛠️ Contributing

```sh
pnpm install
pnpm test          # run tests
pnpm test:watch    # watch mode
pnpm build         # build dist
```

See [CONTRIBUTING.md](https://github.com/rstackio/services/blob/main/CONTRIBUTING.md) for the full guide, including how to add a changeset to your PR.

---

## 👥 Contributors

Amazing people who made their contributions. Feel free to contribute!

<a href="https://github.com/rstackio/services/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rstackio/services" />
</a>

---

## License: [MIT](https://github.com/rstackio/services/blob/main/LICENSE)
