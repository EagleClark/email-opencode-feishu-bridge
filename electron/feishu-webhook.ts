import { addLog } from './log-manager';

export async function sendToFeishuWebhook(
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

  addLog('info', 'feishu', `飞书通知已发送: "${title}"`);
}
