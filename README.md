# Services

> Minimal TypeScript toolkit for async data fetching —
> typed errors, chainable transforms, zero-config mocking.

[![npm](https://img.shields.io/npm/v/@rstackio/services)](https://www.npmjs.com/package/@rstackio/services)
[![CI](https://github.com/rstackio/services/actions/workflows/ci.yml/badge.svg)](https://github.com/rstackio/services/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@rstackio/services)](https://github.com/rstackio/services/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

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

Each feature module owns its data layer in a `data-provider/` folder:

```
src/
  modules/
    user/
      models/
        user.ts         ← types and validation schema
      data-provider/
        api.ts          ← real async function
        mock.ts         ← mock using delay()
        normalize.ts    ← pure function to transform API response
        provider.ts     ← createProvider(api).andMock(mock).andThen(normalize)
        index.ts        ← export * from './provider'
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

## 🛠️ Development

```sh
pnpm install
pnpm test          # run tests
pnpm test:watch    # watch mode
pnpm build         # build dist
```

---

## 👥 Contributors

Amazing people who made their contributions. Feel free to contribute!

<a href="https://github.com/rstackio/services/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rstackio/services" />
</a>

---

## License: [MIT](https://github.com/rstackio/services/blob/main/LICENSE)
