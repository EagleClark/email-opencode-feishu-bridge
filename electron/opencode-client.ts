import { createOpencodeClient } from '@opencode-ai/sdk';
import type { EmailConfig, StoredEmail } from './types';

export async function sendEmailToOpenCode(
  config: EmailConfig,
  email: StoredEmail,
): Promise<void> {
  if (!config.openCodeHost || !config.openCodePort) return;

  const baseUrl = `http://${config.openCodeHost}:${config.openCodePort}`;
  const client = createOpencodeClient({ baseUrl });

  try {
    const session = await client.session.create({
      body: { title: `邮件: ${email.subject}` },
    });
    if (!session.data) return;

    const content = [
      `发件人: ${email.fromName} <${email.fromAddress}>`,
      `主题: ${email.subject}`,
      `时间: ${new Date(email.date).toLocaleString('zh-CN')}`,
      '',
      email.textPreview,
    ].join('\n');

    await client.session.promptAsync({
      path: { id: session.data.id },
      body: {
        parts: [{ type: 'text', text: content }],
      },
    });
  } catch (err) {
    console.error('[OpenCode] Failed to send email:', err);
  }
}

export async function testOpenCodeConnection(
  host: string,
  port: number,
): Promise<{ valid: boolean; error?: string }> {
  const baseUrl = `http://${host}:${port}`;
  const client = createOpencodeClient({ baseUrl });

  try {
    await client.session.list();
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err.message || String(err) };
  }
}
