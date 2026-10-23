import { defineConfig } from 'vitest/config';

// Configuración adicional de Vitest que carga `ng test` (runnerConfig: true en angular.json).
export default defineConfig({
  test: {
    // Las auditorías de axe-core en jsdom tardan varios segundos con la suite completa en paralelo.
    testTimeout: 20_000,
  },
});
