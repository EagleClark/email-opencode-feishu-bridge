import { Stack, Text, Center, Skeleton, Alert } from '@mantine/core';
import { EmailCard } from './EmailCard';
import type { StoredEmail } from '../types';

interface Props {
  emails: StoredEmail[];
  loading: boolean;
  error: string | null;
  onAck: (uid: number) => void;
}

export function EmailList({ emails, loading, error, onAck }: Props) {
  if (loading) {
    return (
      <Stack gap="md">
        {[1, 2, 3].map(i => <Skeleton key={i} height={120} radius="md" />)}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert title="❌ 错误" color="red">
        {error}
      </Alert>
    );
  }

  if (emails.length === 0) {
    return (
      <Center h={200}>
        <Text c="dimmed">📭 暂无来自监控发件人的邮件</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {emails.map(email => (
        <EmailCard key={email.uid} email={email} onAck={onAck} />
      ))}
    </Stack>
  );
}
