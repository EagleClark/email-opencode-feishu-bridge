import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import type { BrowserWindow } from 'electron';
import type { EmailConfig, StoredEmail, MonitorStatus } from './types';
import { ConfigStore } from './config-store';
import { sendEmailToOpenCode } from './opencode-client';
import { addLog } from './log-manager';

export class EmailEngine {
  private client: ImapFlow;
  private config: EmailConfig;
  private configStore: ConfigStore;
  private win: BrowserWindow;
  private connected = false;
  private running = false;
  private lastChecked: string | null = null;
  private lastError: string | null = null;
  private cachedEmails: StoredEmail[] = [];
  private ackedUids: Set<number>;
  private processedInSession: Set<number>;
  private processing = false;
  private monitorPromise: Promise<void> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private maxCached = 200;
  private backoffDelay = 1000;

  constructor(config: EmailConfig, configStore: ConfigStore, win: BrowserWindow) {
    this.config = config;
    this.configStore = configStore;
    this.win = win;
    this.ackedUids = new Set(configStore.loadAcks());
    this.processedInSession = new Set();

    this.client = new ImapFlow({
      host: config.imapHost,
      port: config.imapPort,
      auth: { user: config.username, pass: config.password },
      secure: config.useTls,
      logger: false,
    });
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.backoffDelay = 1000;
    addLog('info', 'system', '监控已启动');
    this.monitorPromise = this.monitorLoop();
    this.pollTimer = setInterval(() => {
      if (!this.connected) return;
      this.handleNewEmails().catch(() => {});
    }, 30000);
    this.pushStatus();
  }

  async stop(): Promise<void> {
    this.running = false;
    this.connected = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    try {
      await this.client.logout();
    } catch { /* ignore */ }
    addLog('info', 'system', '监控已停止');
    this.pushStatus();
  }

  private async monitorLoop(): Promise<void> {
    while (this.running) {
      try {
        await this.client.connect();
        this.connected = true;
        this.backoffDelay = 1000;
        this.lastError = null;
        addLog('info', 'email', `IMAP 已连接 (${this.config.imapHost}:${this.config.imapPort})`);
        this.pushStatus();

        const lock = await this.client.getMailboxLock('INBOX');
        try {
          await this.handleNewEmails();
          while (this.running && this.connected) {
            await this.client.idle();
            await this.handleNewEmails();
          }
        } finally {
          lock.release();
        }
      } catch (err: any) {
        this.connected = false;
        this.lastError = err.message || String(err);
        addLog('error', 'email', `IMAP 连接断开: ${this.lastError}`);
        this.pushError(this.lastError);
        this.pushStatus();
        if (this.running) {
          await this.sleep(this.backoffDelay);
          this.backoffDelay = Math.min(this.backoffDelay * 2, 30000);
        }
      }
    }
  }

  private async handleNewEmails(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      const uids = await this.client.search({ unseen: true });
      if (!uids || uids.length === 0) return;

      for (const uid of uids) {
        if (this.processedInSession.has(uid as number)) continue;

        try {
          const msg = await this.client.fetchOne(uid, { source: true });
          if (!msg) continue;

          const parsed = await simpleParser(msg.source);
          const fromAddress = parsed.from?.value?.[0]?.address || '';

          if (!this.matchesSender(fromAddress)) continue;

          const isAcked = this.ackedUids.has(uid as number);

          const stored: StoredEmail = {
            uid: uid as number,
            messageId: parsed.messageId || String(uid),
            subject: parsed.subject || '(No subject)',
            fromName: parsed.from?.value?.[0]?.name || fromAddress,
            fromAddress,
            date: parsed.date || new Date(),
            textPreview: (parsed.text || '').slice(0, 200),
            htmlBody: parsed.html || undefined,
            acked: isAcked,
            receivedAt: new Date(),
          };

          this.processedInSession.add(stored.uid);
          this.cacheEmail(stored);
          this.win.webContents.send('email:new', stored);
          this.markAcked(stored.uid);
          addLog('info', 'email', `收到新邮件: "${stored.subject}" (${stored.fromAddress})`);
          sendEmailToOpenCode(this.config, stored);
        } catch { /* skip individual fetch errors */ }
      }

      this.lastChecked = new Date().toISOString();
      this.pushStatus();
    } finally {
      this.processing = false;
    }
  }

  private matchesSender(fromAddress: string): boolean {
    const normalized = fromAddress.toLowerCase().trim();
    if (!normalized) return false;
    return this.config.monitoredSenders.some(sender => {
      const s = sender.toLowerCase().trim();
      if (!s) return false;
      if (this.config.senderMatchType === 'exact') {
        return normalized === s;
      }
      return normalized.endsWith(`@${s}`);
    });
  }

  private cacheEmail(email: StoredEmail): void {
    const idx = this.cachedEmails.findIndex(e => e.uid === email.uid);
    if (idx >= 0) {
      this.cachedEmails[idx] = email;
    } else {
      this.cachedEmails.unshift(email);
      if (this.cachedEmails.length > this.maxCached) {
        this.cachedEmails.pop();
      }
    }
  }

  getEmails(): StoredEmail[] {
    return this.cachedEmails;
  }

  markAcked(uid: number): void {
    this.ackedUids.add(uid);
    this.configStore.saveAcks([...this.ackedUids]);
    const email = this.cachedEmails.find(e => e.uid === uid);
    if (email) {
      email.acked = true;
    }
  }

  getStatus(): MonitorStatus {
    return {
      running: this.running,
      connected: this.connected,
      lastChecked: this.lastChecked,
      lastError: this.lastError,
      monitoredSenders: this.config.monitoredSenders,
    };
  }

  private pushStatus(): void {
    this.win.webContents.send('monitor:status', this.getStatus());
  }

  private pushError(error: string): void {
    this.win.webContents.send('monitor:error', error);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
