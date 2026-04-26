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

## Project Structure

```
├── electron/
│   ├── main.ts              — Main process entry: BrowserWindow, menu, engine init
│   ├── preload.cjs           — contextBridge API (CommonJS, required by Electron)
│   ├── types.ts              — Main-process type definitions
│   ├── config-store.ts       — JSON file persistence for config + acked UIDs
│   ├── email-engine.ts       — IMAP monitoring: IDLE + poll, send to OpenCode
│   ├── opencode-client.ts    — OpenCode AI SDK integration (session create + prompt)
│   ├── feishu-webhook.ts     — Feishu bot Webhook POST (post message type)
│   ├── ipc-handlers.ts       — All ipcMain.handle() registrations
│   └── log-manager.ts        — Singleton log manager (in-memory + optional file)
├── src/
│   ├── main.tsx              — React entry point
│   ├── App.tsx               — Root: MantineProvider → Router
│   ├── Router.tsx            — createHashRouter with AppLayout + 3 child routes
│   ├── theme.ts              — Mantine theme overrides
│   ├── types.ts              — Shared types + ElectronAPI global declaration
│   ├── context/
│   │   └── AppContext.tsx    — Global state: config, emails, monitorStatus, logs
│   ├── components/
│   │   ├── AppLayout.tsx     — AppShell: header (status + controls) + navbar + outlet
│   │   ├── ConfigForm.tsx    — Full settings form (IMAP, OpenCode, Feishu, Log)
│   │   ├── EmailCard.tsx     — Single email display card
│   │   ├── EmailList.tsx     — Email list with empty/loading/error states
│   │   └── MonitorStatusBadge.tsx — Header status indicator
│   └── pages/
│       ├── SettingsPage.tsx  — Route /: ConfigForm wrapper
│       ├── EmailPage.tsx     — Route /email: email list with refresh
│       └── LogPage.tsx       — Route /log: scrolling log viewer
└── package.json              — electron-builder config under "build" key
```

## Architecture

### Data Flow

```
IMAP Server
  ↓ (IDLE + 30s poll)
EmailEngine.handleNewEmails()
  ├─ cache email → webContents.send('email:new') → renderer
  ├─ markAcked (persist UID to disk)
  └─ sendEmailToOpenCode()
       ├─ create OpenCode session
       ├─ send email content → await response
       ├─ send "processing" Feishu notification
       └─ send result to Feishu webhook
```

### Logging (log-manager.ts)

Singleton module. `addLog()` pushes entries to:
1. In-memory ring buffer (max 2000 entries)
2. Optional file (append, local-timezone timestamps)
3. Renderer via `webContents.send('log:new', entry)`

### IPC Bridge

Renderer uses `window.electronAPI` (exposed via contextBridge in preload.cjs):
- `config:get/save/validate` — configuration CRUD
- `email:list/mark-acked` — email data
- `monitor:start/stop/status` — monitoring control
- `opencode:test` — test OpenCode connection
- `log:list/clear` — log management
- `dialog:save-log` — native save dialog for log file path
- `email:new` / `monitor:error` / `log:new` — push events from main → renderer

### Email Dedup

Two sets prevent duplicate processing:
- `processedInSession` (in-memory, per engine instance) — guards handleNewEmails()
- `ackedUids` (persisted to disk) — UI display only, marks "已处理"
- `processing` boolean — prevents concurrent handleNewEmails() from IDLE + poll

## Key Constraints

- **Always use `createHashRouter`** (not `createBrowserRouter`). Electron loads via `file://` protocol which doesn't support HTML5 History API path routing.
- **`node-linker=hoisted`** is intentional. The project uses pnpm but electron-builder's native tools (makensis.exe) fail on Windows paths exceeding 260 chars when using pnpm's default nested virtual store.
- **electron-builder config** lives in `package.json` under the `"build"` key. Output goes to `release/`.
- Build output: `dist/` (React client), `dist-electron/` (main + preload), `release/` (installer).
- **preload.cjs must be copied** to `dist-electron/` before build (done in package.json scripts via `fs.copyFileSync`). This is because vite-plugin-electron only compiles `.ts` files and the preload is `.cjs`.
