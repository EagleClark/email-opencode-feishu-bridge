import { useState } from 'react';
import { ActionIcon, AppShell, Button, Divider, Group, NavLink, Title, Tooltip, useMantineColorScheme, Stack } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop, IconSettings, IconMailCheck, IconPlugConnected, IconNotebook } from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MonitorStatusBadge } from './MonitorStatusBadge';

const navItems = [
  { label: '设置', path: '/', icon: IconSettings },
  { label: '邮件状态', path: '/email', icon: IconMailCheck },
  { label: '运行日志', path: '/log', icon: IconNotebook },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, startMonitor, stopMonitor } = useApp();
  const { colorScheme, setColorScheme, clearColorScheme } = useMantineColorScheme();
  const [autoMode, setAutoMode] = useState(() => !localStorage.getItem('mantine-color-scheme-value'));

  const themeIcon = autoMode ? <IconDeviceDesktop size={18} /> : colorScheme === 'light' ? <IconSun size={18} /> : <IconMoon size={18} />;
  const themeLabel = autoMode ? '跟随系统' : colorScheme === 'light' ? '浅色' : '深色';

  const toggleTheme = () => {
    if (autoMode) {
      setColorScheme('light');
      setAutoMode(false);
    } else if (colorScheme === 'light') {
      setColorScheme('dark');
    } else {
      clearColorScheme();
      setAutoMode(true);
    }
  };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 200, breakpoint: 0 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <IconPlugConnected size={22} />
            <Title order={4}>Email-OpenCode-飞书桥接器</Title>
          </Group>
          <Group gap="sm">
            <MonitorStatusBadge status={state.monitorStatus} />
            <Button
              size="xs"
              variant="light"
              color="green"
              onClick={startMonitor}
              disabled={!state.config || state.monitorStatus.running}
            >
              开始监控
            </Button>
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={stopMonitor}
              disabled={!state.monitorStatus.running}
            >
              停止
            </Button>
            <Divider orientation="vertical" />
            <Tooltip label={themeLabel}>
              <ActionIcon variant="light" onClick={toggleTheme} size="lg">
                {themeIcon}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="sm">
        <Stack gap="xs">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              variant="light"
              py="sm"
            />
          ))}
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
