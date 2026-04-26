export interface EmailConfig {
  imapHost: string;
  imapPort: number;
  username: string;
  password: string;
  useTls: boolean;
  monitoredSenders: string[];
  senderMatchType: 'exact' | 'domain';
  openCodeHost?: string;
  openCodePort?: number;
  feishuWebhookUrl?: string;
  logFilePath?: string;
}

export interface StoredEmail {
  uid: number;
  messageId: string;
  subject: string;
  fromName: string;
  fromAddress: string;
  date: Date;
  textPreview: string;
  htmlBody?: string;
  acked: boolean;
  receivedAt: Date;
}

export interface MonitorStatus {
  running: boolean;
  connected: boolean;
  lastChecked: string | null;
  lastError: string | null;
  monitoredSenders: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'email' | 'opencode' | 'feishu' | 'system';
  message: string;
}

export interface ElectronAPI {
  getConfig: () => Promise<EmailConfig | null>;
  saveConfig: (config: EmailConfig) => Promise<void>;
  validateConfig: (config: EmailConfig) => Promise<ValidationResult>;
  getEmails: () => Promise<StoredEmail[]>;
  markEmailAcked: (uid: number) => Promise<void>;
  getMonitorStatus: () => Promise<MonitorStatus>;
  startMonitor: () => Promise<void>;
  stopMonitor: () => Promise<void>;
  testOpenCode: (host: string, port: number) => Promise<ValidationResult>;
  getLogs: () => Promise<LogEntry[]>;
  clearLogs: () => Promise<void>;
  selectLogFilePath: () => Promise<string | null>;
  onNewEmail: (cb: (email: StoredEmail) => void) => () => void;
  onMonitorError: (cb: (error: string) => void) => () => void;
  onNewLog: (cb: (log: LogEntry) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
