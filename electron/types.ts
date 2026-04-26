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
