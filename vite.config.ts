import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Espelha server.ts: HMR opt-in (ENABLE_HMR=true); preview do AI Studio não suporta WS upgrade.
  const isHmrDisabled = process.env.DISABLE_HMR === 'true' || process.env.ENABLE_HMR !== 'true';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: isHmrDisabled ? false : undefined,
      watch: isHmrDisabled ? null : {},
    },
  };
});
