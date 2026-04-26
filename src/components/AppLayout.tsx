import { useState } from 'react';
import { ActionIcon, AppShell, Group, NavLink, Title, Tooltip, useMantineColorScheme, Stack } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop, IconSettings, IconMailCheck, IconPlugConnected } from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { label: '设置', path: '/', icon: IconSettings },
  { label: '邮件状态', path: '/email', icon: IconMailCheck },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
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
      header={{ height: 50 }}
      navbar={{ width: 200, breakpoint: 0 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <IconPlugConnected size={22} />
            <Title order={4}>Email-OpenCode-飞书桥接器</Title>
          </Group>
          <Tooltip label={themeLabel}>
            <ActionIcon variant="light" onClick={toggleTheme} size="lg">
              {themeIcon}
            </ActionIcon>
          </Tooltip>
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
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
