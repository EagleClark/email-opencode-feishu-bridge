import { Stack, Title, Paper } from '@mantine/core';
import { useApp } from '../context/AppContext';
import { ConfigForm } from '../components/ConfigForm';

export function SettingsPage() {
  const { state, saveConfig, validateConfig, testOpenCode } = useApp();

  return (
    <Stack gap="lg">
      <Title order={3}>⚙️ 设置</Title>

      <Paper shadow="xs" p="md" radius="md" withBorder>
        <ConfigForm
          initialConfig={state.config}
          onSave={saveConfig}
          onValidate={validateConfig}
          onTestOpenCode={testOpenCode}
        />
      </Paper>
    </Stack>
  );
}
