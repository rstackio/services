import { withRslibConfig } from '@rstest/adapter-rslib';
import { defineConfig } from '@rstest/core';

export default defineConfig({
  extends: withRslibConfig(),
  globals: true,
  testEnvironment: 'happy-dom',
  coverage: {
    provider: 'istanbul',
    thresholds: {
      statements: 80,
      functions: 80,
      branches: 80,
      lines: 80,
    },
  },
});
