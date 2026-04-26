import { useEffect, useRef } from 'react';
import { Stack, Title, Button, Group, Badge, Text, ScrollArea, Paper, Box } from '@mantine/core';
import { useApp } from '../context/AppContext';
import type { LogEntry } from '../types';

const categoryLabels: Record<LogEntry['category'], string> = {
  email: '邮件',
  opencode: 'OpenCode',
  feishu: '飞书',
  system: '系统',
};

const categoryColors: Record<LogEntry['category'], string> = {
  email: 'blue',
  opencode: 'violet',
  feishu: 'cyan',
  system: 'gray',
};

const levelColors: Record<LogEntry['level'], string> = {
  info: 'gray',
  warn: 'yellow',
  error: 'red',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${M}-${D} ${h}:${m}:${s}`;
}

export function LogPage() {
  const { state, clearLogs } = useApp();
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [state.logs.length]);

  return (
    <Stack style={{ flex: 1, minHeight: 0 }} gap="lg">
      <Group justify="space-between" align="center">
        <Title order={3}>📋 运行日志</Title>
        <Group gap="sm">
          <Text size="sm" c="dimmed">共 {state.logs.length} 条</Text>
          <Button size="xs" variant="light" color="red" onClick={clearLogs}>
            清空日志
          </Button>
        </Group>
      </Group>

      <Paper shadow="xs" radius="md" withBorder style={{ flex: 1, minHeight: 0 }}>
        <ScrollArea style={{ height: '100%' }} viewportRef={viewport}>
          <Box p="md">
            {state.logs.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">暂无日志</Text>
            ) : (
              <Stack gap="xs">
                {state.logs.map((log, i) => (
                  <Group key={i} gap="sm" wrap="nowrap" align="flex-start">
                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', whiteSpace: 'nowrap', minWidth: 150 }}>
                      {formatTime(log.timestamp)}
                    </Text>
                    <Badge size="sm" color={categoryColors[log.category]} variant="light" style={{ minWidth: 60 }}>
                      {categoryLabels[log.category]}
                    </Badge>
                    <Badge size="sm" color={levelColors[log.level]} variant="filled">
                      {log.level.toUpperCase()}
                    </Badge>
                    <Text size="sm" style={{ wordBreak: 'break-word' }}>{log.message}</Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Box>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
