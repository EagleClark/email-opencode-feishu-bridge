import { Badge, Tooltip } from '@mantine/core';
import type { MonitorStatus } from '../types';

interface Props {
  status: MonitorStatus;
}

export function MonitorStatusBadge({ status }: Props) {
  if (!status.running) {
    return <Badge color="gray">已停止</Badge>;
  }
  if (status.connected) {
    return (
      <Tooltip label={status.lastChecked ? `上次检查: ${new Date(status.lastChecked).toLocaleString()}` : undefined}>
        <Badge color="green">已连接</Badge>
      </Tooltip>
    );
  }
  return (
    <Tooltip label={status.lastError || '未知错误'}>
      <Badge color="red">已断开</Badge>
    </Tooltip>
  );
}
