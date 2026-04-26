import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import electronRenderer from 'vite-plugin-electron-renderer'
import { builtinModules } from 'node:module'

const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
]

const externalModules = [
  ...nodeBuiltins,
  'imapflow',
  'mailparser',
  '@opencode-ai/sdk',
  'cross-spawn',
]

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: externalModules,
            },
          },
        },
      },
    ]),
    electronRenderer(),
  ],
})
