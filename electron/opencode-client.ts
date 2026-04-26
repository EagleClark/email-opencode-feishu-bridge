import { createOpencodeClient } from '@opencode-ai/sdk';
import type { EmailConfig, StoredEmail } from './types';
import { sendToFeishuWebhook } from './feishu-webhook';

export async function sendEmailToOpenCode(
  config: EmailConfig,
  email: StoredEmail,
  onProcessed?: () => void,
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

    const result = await client.session.prompt({
      path: { id: session.data.id },
      body: {
        parts: [{ type: 'text' as const, text: content }],
      },
    });

    // Extract text from response parts
    const responseText = result.data?.parts
      ?.filter((p: any): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('\n')
      .trim();

    // Send response to Feishu webhook if configured
    if (responseText && config.feishuWebhookUrl) {
      const preview = responseText.length > 4000
        ? responseText.slice(0, 4000) + '\n\n...（内容过长已截断）'
        : responseText;

      await sendToFeishuWebhook(
        config.feishuWebhookUrl,
        `OpenCode 回复: ${email.subject}`,
        preview,
      );
    }

    onProcessed?.();
  } catch (err) {
    console.error('[OpenCode] Failed to process email:', err);
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
