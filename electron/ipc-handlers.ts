import type { IpcMain, BrowserWindow } from 'electron';
import { ImapFlow } from 'imapflow';
import { ConfigStore } from './config-store';
import { EmailEngine } from './email-engine';
import { testOpenCodeConnection } from './opencode-client';
import type { EmailConfig, ValidationResult } from './types';

interface EngineRef {
  getEngine: () => EmailEngine | null;
  createEngine: (config: EmailConfig) => void;
}

export function registerIpcHandlers(
  ipcMain: IpcMain,
  configStore: ConfigStore,
  engineRef: EngineRef,
  win: BrowserWindow,
): void {
  ipcMain.handle('config:get', () => {
    return configStore.loadConfig();
  });

  ipcMain.handle('config:save', (_event, config: EmailConfig) => {
    configStore.saveConfig(config);
    engineRef.createEngine(config);
  });

  ipcMain.handle('config:validate', async (_event, config: EmailConfig): Promise<ValidationResult> => {
    const testClient = new ImapFlow({
      host: config.imapHost,
      port: config.imapPort,
      auth: { user: config.username, pass: config.password },
      secure: config.useTls,
      logger: false,
    });
    try {
      await testClient.connect();
      await testClient.logout();
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle('email:list', () => {
    return engineRef.getEngine()?.getEmails() ?? [];
  });

  ipcMain.handle('email:mark-acked', (_event, uid: number) => {
    engineRef.getEngine()?.markAcked(uid);
  });

  ipcMain.handle('monitor:status', () => {
    const engine = engineRef.getEngine();
    return engine?.getStatus() ?? {
      running: false,
      connected: false,
      lastChecked: null,
      lastError: null,
      monitoredSenders: [],
    };
  });

  ipcMain.handle('monitor:start', () => {
    const config = configStore.loadConfig();
    if (config) {
      engineRef.createEngine(config);
    }
  });

  ipcMain.handle('monitor:stop', () => {
    engineRef.getEngine()?.stop();
  });

  ipcMain.handle('opencode:test', async (_event, host: string, port: number) => {
    return testOpenCodeConnection(host, port);
  });

  // Push monitor:status updates to renderer from engine
  ipcMain.on('monitor:status-push', () => {
    const engine = engineRef.getEngine();
    if (engine) {
      win.webContents.send('monitor:status', engine.getStatus());
    }
  });
}
