import { addLog } from './log-manager';

interface QueuedMessage {
  webhookUrl: string;
  title: string;
  text: string;
  resolve: () => void;
  reject: (err: Error) => void;
}

const MAX_PER_SECOND = 1;
const MAX_PER_MINUTE = 30;
const WINDOW_MS = 60_000;

const sendTimestamps: number[] = [];
const queue: QueuedMessage[] = [];
let processing = false;

function canSend(): boolean {
  const now = Date.now();
  // Remove timestamps older than 1 minute
  while (sendTimestamps.length > 0 && sendTimestamps[0] < now - WINDOW_MS) {
    sendTimestamps.shift();
  }
  // Check per-minute limit
  if (sendTimestamps.length >= MAX_PER_MINUTE) return false;
  // Check per-second limit (last entry is the most recent)
  if (sendTimestamps.length > 0) {
    const lastSend = sendTimestamps[sendTimestamps.length - 1];
    if (now - lastSend < 1000) return false;
  }
  return true;
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    while (queue.length > 0) {
      if (!canSend()) {
        // Wait until next slot
        const nextSlot = sendTimestamps.length > 0
          ? Math.max(
              sendTimestamps[0] + WINDOW_MS,
              sendTimestamps[sendTimestamps.length - 1] + 1000,
            )
          : Date.now();
        const delay = Math.max(100, nextSlot - Date.now());
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const msg = queue.shift()!;
      try {
        await doSend(msg.webhookUrl, msg.title, msg.text);
        msg.resolve();
      } catch (err) {
        msg.reject(err instanceof Error ? err : new Error(String(err)));
      }
    }
  } finally {
    processing = false;
  }
}

async function doSend(
  webhookUrl: string,
  title: string,
  text: string,
): Promise<void> {
  const body = JSON.stringify({
    msg_type: 'post',
    content: {
      post: {
        zh_cn: {
          title,
          content: [[{ tag: 'text', text }]],
        },
      },
    },
  });

  addLog('info', 'feishu', `正在发送飞书通知: "${title}"`);

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data = await res.json();
  if (data.code !== 0) {
    const errMsg = data.msg || JSON.stringify(data);
    addLog('error', 'feishu', `飞书 Webhook 发送失败: "${title}": ${errMsg}`);
    throw new Error(`Feishu webhook error: ${errMsg}`);
  }

  sendTimestamps.push(Date.now());
  addLog('info', 'feishu', `飞书通知已发送: "${title}"`);
}

export function sendToFeishuWebhook(
  webhookUrl: string,
  title: string,
  text: string,
): Promise<void> {
  if (canSend()) {
    return doSend(webhookUrl, title, text).catch(err => {
      // Re-queue on network failure
      addLog('warn', 'feishu', `飞书发送失败，重新排队: "${title}"`);
      return new Promise<void>((resolve, reject) => {
        queue.push({ webhookUrl, title, text, resolve, reject });
        processQueue();
      });
    });
  }

  return new Promise<void>((resolve, reject) => {
    queue.push({ webhookUrl, title, text, resolve, reject });
    processQueue();
  });
}
