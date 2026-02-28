import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      bundle: false,
      dts: true,
      format: 'esm',
      syntax: ['node 24'],
      output: {
        distPath: {
          root: './dist',
        },
      },
    },
  ],
  source: {
    entry: {
      index: 'src/**/!(*.d|*.stories|*.test).{ts,tsx,css}',
    },
    tsconfigPath: './tsconfig.source.json',
  },
});
