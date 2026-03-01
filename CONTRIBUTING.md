# Contributing

## Setup

```sh
pnpm install
pnpm test:watch   # run tests in watch mode
pnpm dev          # watch mode — rebuilds on file changes
```

## Making a PR

### 1. Make your changes

Write code, add or update tests, update docs if needed.

### 2. Add a changeset

Every PR that touches source code **must include a changeset** — CI will fail without one.

```sh
pnpm changeset
```

This opens an interactive prompt:

```
🦋  What kind of change is this for @rstackio/services?
  ❯ patch  — bug fix, dependency update, internal refactor
    minor  — new backwards-compatible feature
    major  — breaking change
```

Pick the bump type, write a short description of what changed and why (this becomes the CHANGELOG entry), then commit the generated `.changeset/*.md` file with your PR.

### 3. Commit message format

This repo uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

feat(data-provider): add andFinally() chain method
fix(mock): handle AbortSignal on delay cancel
docs: update usage examples
chore: upgrade typescript to 5.9
```

Common types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

### 4. Open the PR

CI runs types, deps, linting, tests, and the changeset check automatically.

---

## Release flow

Releases are fully automated — you don't need to bump versions or publish manually.

When your PR is merged to `main`, the publish pipeline runs automatically:
1. It applies all pending changesets — bumps the version in `package.json` and generates `CHANGELOG.md`.
2. Commits the version bump directly to `main` and publishes the package to npm.
