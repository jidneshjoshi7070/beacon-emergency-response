import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/HackathonTools/**', '**/outputs/**', '**/work/**'],
    },
  },
});
