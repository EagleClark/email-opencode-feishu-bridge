import { app } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { EmailConfig } from './types';

const CONFIG_FILE = 'email-config.json';
const ACKS_FILE = 'email-acks.json';

export class ConfigStore {
  private configPath: string;
  private acksPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, CONFIG_FILE);
    this.acksPath = path.join(userDataPath, ACKS_FILE);
  }

  loadConfig(): EmailConfig | null {
    try {
      const data = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(data) as EmailConfig;
    } catch {
      return null;
    }
  }

  saveConfig(config: EmailConfig): void {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  loadAcks(): number[] {
    try {
      const data = fs.readFileSync(this.acksPath, 'utf-8');
      return JSON.parse(data) as number[];
    } catch {
      return [];
    }
  }

  saveAcks(uids: number[]): void {
    const dir = path.dirname(this.acksPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.acksPath, JSON.stringify(uids), 'utf-8');
  }
}
