import { app, BrowserWindow, ipcMain, Menu, shell, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigStore } from './config-store';
import { EmailEngine } from './email-engine';
import { registerIpcHandlers } from './ipc-handlers';
import type { EmailConfig } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let configStore: ConfigStore;
let emailEngine: EmailEngine | null = null;

const GITHUB_URL = 'https://github.com/EagleClark/email-opencode-feishu-bridge';

function buildAppMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'close', label: '关闭' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 Email-OpenCode-飞书桥接器',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: '关于',
              message: 'Email-OpenCode-飞书桥接器',
              detail: [
                `版本: ${app.getVersion()}`,
                '',
                '将邮件内容发送到 OpenCode 处理，',
                '并通过飞书 Webhook 推送结果。',
              ].join('\n'),
            });
          },
        },
        {
          label: 'GitHub 仓库',
          click: () => {
            shell.openExternal(GITHUB_URL);
          },
        },
        {
          label: '作者',
          click: () => {
            shell.openExternal('https://eagle90.com/');
          },
        },
      ],
    },
  ]));
}

function createEngine(config: EmailConfig) {
  if (emailEngine) {
    emailEngine.stop();
  }
  emailEngine = new EmailEngine(config, configStore, mainWindow!);
  emailEngine.start();
}

app.whenReady().then(() => {
  buildAppMenu();

  configStore = new ConfigStore();
  console.log('[Config] userData path:', app.getPath('userData'));

  mainWindow = new BrowserWindow({
    title: 'Email-OpenCode-Feishu-Bridge',
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
