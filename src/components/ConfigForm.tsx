import { useState, useEffect } from 'react';
import {
  TextInput,
  NumberInput,
  PasswordInput,
  Switch,
  Button,
  Stack,
  Group,
  TagsInput,
  SegmentedControl,
  Text,
  Alert,
} from '@mantine/core';
import type { EmailConfig } from '../types';

interface Props {
  initialConfig: EmailConfig | null;
  onSave: (config: EmailConfig) => Promise<void>;
  onValidate: (config: EmailConfig) => Promise<{ valid: boolean; error?: string }>;
}

const defaultConfig: EmailConfig = {
  imapHost: '',
  imapPort: 993,
  username: '',
  password: '',
  useTls: true,
  monitoredSenders: [],
  senderMatchType: 'exact',
};

export function ConfigForm({ initialConfig, onSave, onValidate }: Props) {
  const [config, setConfig] = useState<EmailConfig>(initialConfig ?? defaultConfig);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const update = <K extends keyof EmailConfig>(key: K, value: EmailConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await onValidate(config);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(config);
    setSaving(false);
  };

  return (
    <Stack gap="md">
      <TextInput
        label="IMAP 服务器"
        placeholder="imap.example.com"
        value={config.imapHost}
        onChange={e => update('imapHost', e.currentTarget.value)}
        required
      />
      <Group grow>
        <NumberInput
          label="端口"
          placeholder="993"
          value={config.imapPort}
          onChange={v => update('imapPort', Number(v) || 993)}
          min={1}
          max={65535}
          required
        />
        <Switch
          label="使用 TLS"
          checked={config.useTls}
          onChange={e => update('useTls', e.currentTarget.checked)}
          mt="xl"
        />
      </Group>
      <TextInput
        label="用户名"
        placeholder="your@email.com"
        value={config.username}
        onChange={e => update('username', e.currentTarget.value)}
        required
      />
      <PasswordInput
        label="密码"
        placeholder="应用密码"
        value={config.password}
        onChange={e => update('password', e.currentTarget.value)}
        required
      />

      <Text size="sm" fw={500} mt="md">监控发件人</Text>
      <TagsInput
        placeholder="输入邮箱地址后按回车"
        value={config.monitoredSenders}
        onChange={v => update('monitoredSenders', v)}
        description="要监听的发件人邮箱地址"
      />
      <SegmentedControl
        value={config.senderMatchType}
        onChange={v => update('senderMatchType', v as 'exact' | 'domain')}
        data={[
          { label: '精确匹配', value: 'exact' },
          { label: '域名匹配', value: 'domain' },
        ]}
      />

      {testResult && (
        <Alert
          color={testResult.valid ? 'green' : 'red'}
          title={testResult.valid ? '连接成功' : '连接失败'}
        >
          {testResult.error || '已成功连接到 IMAP 服务器。'}
        </Alert>
      )}

      <Group mt="md">
        <Button onClick={handleTest} loading={testing} variant="light">
          测试连接
        </Button>
        <Button onClick={handleSave} loading={saving}>
          保存
        </Button>
      </Group>
    </Stack>
  );
}
