import { Stack, Title, Button, Group, Paper, Divider, Text } from '@mantine/core';
import { useApp } from '../context/AppContext';
import { ConfigForm } from '../components/ConfigForm';
import { MonitorStatusBadge } from '../components/MonitorStatusBadge';

export function SettingsPage() {
  const { state, saveConfig, validateConfig, testOpenCode, startMonitor, stopMonitor } = useApp();

  return (
    <Stack gap="lg">
      <Title order={3}>邮件设置</Title>

      <Paper shadow="xs" p="md" radius="md" withBorder>
        <ConfigForm
          initialConfig={state.config}
          onSave={saveConfig}
          onValidate={validateConfig}
          onTestOpenCode={testOpenCode}
        />
      </Paper>

      <Divider />

      <Group justify="space-between" align="center">
        <div>
          <Text fw={500}>监控状态</Text>
          <MonitorStatusBadge status={state.monitorStatus} />
        </div>
        <Group>
          <Button
            onClick={startMonitor}
            disabled={!state.config || state.monitorStatus.running}
            color="green"
          >
            开始监控
          </Button>
          <Button
            onClick={stopMonitor}
            disabled={!state.monitorStatus.running}
            color="red"
            variant="light"
          >
            停止
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
