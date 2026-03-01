/**
 * Smoke tests that run against the compiled dist/ output.
 * Verifies every public module is importable and all expected exports are present.
 * Run after `pnpm build` via `pnpm test:build`.
 */

describe('@rstackio/services/safe', () => {
  it('exports safe()', async () => {
    const mod = await import('../dist/safe/index.js');
    expect(mod.safe).toBeTypeOf('function');
  });
});

describe('@rstackio/services/data-provider', () => {
  it('exports createSafeProvider() and createProvider()', async () => {
    const mod = await import('../dist/data-provider/index.js');
    expect(mod.createSafeProvider).toBeTypeOf('function');
    expect(mod.createProvider).toBeTypeOf('function');
  });
});

describe('@rstackio/services/mock', () => {
  it('exports mock utilities', async () => {
    const mod = await import('../dist/mock/index.js');
    expect(mod.isMockEnabled).toBeTypeOf('function');
    expect(mod.enableMock).toBeTypeOf('function');
    expect(mod.disableMock).toBeTypeOf('function');
    expect(mod.delay).toBeTypeOf('function');
  });
});

describe('@rstackio/services/logger', () => {
  it('exports Logger class', async () => {
    const mod = await import('../dist/logger/index.js');
    expect(mod.Logger).toBeTypeOf('function');
  });
});

describe('@rstackio/services/errors', () => {
  it('is importable (type-only module)', async () => {
    await expect(import('../dist/errors/index.js')).resolves.toBeDefined();
  });
});
