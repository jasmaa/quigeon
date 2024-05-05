import { mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, {
  test: {
    environment: "jsdom",
    setupFiles: "setup-tests.ts",
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      include: ["src/**"],
      enabled: true,
      all: false,
    },
  },
});
