# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` - Start development server with Vite + Electron HMR
- `pnpm build` - Full build: tsc type-check → Vite production build → electron-builder packaging
- `pnpm lint` - Run ESLint on all source files

## Tech Stack

- **Electron 41** - Desktop shell, loads renderer via `win.loadFile('dist/index.html')` (file:// protocol)
- **React 19** + **TypeScript 6** - Renderer UI
- **Vite 8** + **vite-plugin-electron** - Build tooling, compiles 3 targets: client (React), electron main, preload
- **Mantine v9** - React component library and theming
- **React Router v7** - Client-side routing via `createHashRouter` (required for Electron's file:// compat)
- **electron-builder** - Packages NSIS installer for Windows
- **pnpm** - Package manager, configured with `node-linker=hoisted` in `.npmrc` to avoid long path issues on Windows

## Architecture

```
electron/main.ts       — Electron main process: creates BrowserWindow, loads dist/index.html
electron/preload.ts    — Preload script (bridge between main & renderer)
src/main.tsx           — React entry point, mounts <App /> into #root
src/App.tsx            — Root component: MantineProvider → Router
src/Router.tsx         — HashRouter-based route definitions (use createHashRouter, NOT createBrowserRouter)
src/pages/             — Page-level components
src/theme.ts           — Mantine theme overrides
```

### Key constraints

- **Always use `createHashRouter`** (not `createBrowserRouter`). Electron loads via `file://` protocol which doesn't support HTML5 History API path routing.
- **`node-linker=hoisted`** is intentional. The project uses pnpm but electron-builder's native tools (makensis.exe) fail on Windows paths exceeding 260 chars when using pnpm's default nested virtual store.
- **electron-builder config** lives in `package.json` under the `"build"` key. Output goes to `release/`.
- Build output: `dist/` (React client), `dist-electron/` (main + preload), `release/` (installer).
