import { useState } from 'react';
import { Card, Group, Text, Button, Collapse, Stack } from '@mantine/core';
import type { StoredEmail } from '../types';

interface Props {
  email: StoredEmail;
  onAck: (uid: number) => void;
}

export function EmailCard({ email, onAck }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      opacity={email.acked ? 0.6 : 1}
      onClick={() => setExpanded(!expanded)}
      style={{ cursor: 'pointer' }}
    >
      <Group justify="space-between" mb="xs">
        <Text fw={700} lineClamp={1}>{email.fromName}</Text>
        <Text size="sm" c="dimmed">
          {new Date(email.date).toLocaleString()}
        </Text>
      </Group>
      <Text size="sm" fw={500} lineClamp={1} mb="xs">
        {email.subject ? `📎 ${email.subject}` : '📎 (无主题)'}
      </Text>
      <Text size="sm" c="dimmed" lineClamp={expanded ? undefined : 2}>
        {email.textPreview || '📄 (无文本内容)'}
      </Text>

      <Collapse expanded={expanded}>
        <Stack mt="md" gap="xs">
          <Text size="sm"><strong>👤 发件人:</strong> {email.fromName} &lt;{email.fromAddress}&gt;</Text>
          <Text size="sm"><strong>📅 日期:</strong> {new Date(email.date).toLocaleString()}</Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{email.textPreview}</Text>
        </Stack>
      </Collapse>

      {!email.acked ? (
        <Button
          size="xs"
          variant="light"
          mt="sm"
          onClick={(e) => { e.stopPropagation(); onAck(email.uid); }}
        >
          标记已读
        </Button>
      ) : (
        <Text size="xs" c="dimmed" mt="sm">✅ 已读</Text>
      )}
    </Card>
  );
}
