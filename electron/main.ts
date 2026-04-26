import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigStore } from './config-store';
import { EmailEngine } from './email-engine';
import { registerIpcHandlers } from './ipc-handlers';
import type { EmailConfig } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
const configStore = new ConfigStore();
let emailEngine: EmailEngine | null = null;

function createEngine(config: EmailConfig) {
  if (emailEngine) {
    emailEngine.stop();
  }
  emailEngine = new EmailEngine(config, configStore, mainWindow!);
  emailEngine.start();
}

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    title: 'Email Monitor',
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  registerIpcHandlers(ipcMain, configStore, {
    getEngine: () => emailEngine,
    createEngine,
  }, mainWindow!);

  const savedConfig = configStore.loadConfig();
  if (savedConfig) {
    createEngine(savedConfig);
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile('dist/index.html');
  }
});

app.on('window-all-closed', () => {
  emailEngine?.stop();
  app.quit();
});
