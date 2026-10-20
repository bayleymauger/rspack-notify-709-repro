import { defineConfig } from '@rspack/cli';

export default defineConfig({
  mode: 'development',
  entry: './src/index.js',
  experiments: {
    nativeWatcher: true,
  },
});
