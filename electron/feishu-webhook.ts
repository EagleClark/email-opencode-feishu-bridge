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

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Feishu webhook error: ${data.msg || JSON.stringify(data)}`);
  }
}
