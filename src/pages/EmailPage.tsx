import { Group, Button } from '@mantine/core';
import { useApp } from '../context/AppContext';
import { EmailList } from '../components/EmailList';
import { MonitorStatusBadge } from '../components/MonitorStatusBadge';

export function EmailPage() {
  const { state, markAcked, refreshEmails } = useApp();

  return (
    <>
      <Group mb="md" justify="space-between">
        <MonitorStatusBadge status={state.monitorStatus} />
        <Button size="xs" variant="light" onClick={refreshEmails}>
          刷新
        </Button>
      </Group>

      <EmailList
        emails={state.emails}
        loading={state.loading}
        error={state.error}
        onAck={markAcked}
      />
    </>
  );
}
