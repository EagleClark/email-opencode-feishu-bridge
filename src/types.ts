export interface EmailConfig {
  imapHost: string;
  imapPort: number;
  username: string;
  password: string;
  useTls: boolean;
  monitoredSenders: string[];
  senderMatchType: 'exact' | 'domain';
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

export interface ElectronAPI {
  getConfig: () => Promise<EmailConfig | null>;
  saveConfig: (config: EmailConfig) => Promise<void>;
  validateConfig: (config: EmailConfig) => Promise<ValidationResult>;
  getEmails: () => Promise<StoredEmail[]>;
  markEmailAcked: (uid: number) => Promise<void>;
  getMonitorStatus: () => Promise<MonitorStatus>;
  startMonitor: () => Promise<void>;
  stopMonitor: () => Promise<void>;
  onNewEmail: (cb: (email: StoredEmail) => void) => () => void;
  onMonitorError: (cb: (error: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
