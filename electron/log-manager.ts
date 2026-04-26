import { BrowserWindow } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'email' | 'opencode' | 'feishu' | 'system';
  message: string;
}

const MAX_LOGS = 2000;
let logs: LogEntry[] = [];
let logFilePath: string | null = null;
let win: BrowserWindow | null = null;

function formatLocalTime(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
}

export function initLogManager(window: BrowserWindow, filePath?: string | null): void {
  win = window;
  logFilePath = filePath ?? null;
}

export function setLogFilePath(filePath: string | null): void {
  logFilePath = filePath;
}

export function addLog(
  level: LogEntry['level'],
  category: LogEntry['category'],
  message: string,
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
  };

  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }

  if (logFilePath) {
    try {
      const dir = path.dirname(logFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const localTime = formatLocalTime(entry.timestamp);
      const line = `[${localTime}] [${level.toUpperCase()}] [${category}] ${message}\n`;
      fs.appendFileSync(logFilePath, line, 'utf-8');
    } catch {
      // Silently ignore file write errors
    }
  }

  win?.webContents.send('log:new', entry);
}

export function getLogs(): LogEntry[] {
  return logs;
}

export function clearLogs(): void {
  logs = [];
  if (logFilePath) {
    try {
      fs.writeFileSync(logFilePath, '', 'utf-8');
    } catch {
      // Silently ignore
    }
  }
  win?.webContents.send('log:cleared');
}
