import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // true uniquement pour l'aperçu publié (sans accès aux tuiles)
    __ARTIFACT__: false,
  },
  server: { host: true, port: 5173 },
});
