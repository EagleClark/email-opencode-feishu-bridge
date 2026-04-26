import { useState } from 'react';
import { ActionIcon, AppShell, Group, NavLink, Title, Tooltip, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { label: '邮件', path: '/' },
  { label: '设置', path: '/settings' },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { colorScheme, setColorScheme, clearColorScheme } = useMantineColorScheme();
  const [autoMode, setAutoMode] = useState(true);

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
      navbar={{ width: 180, breakpoint: 0 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={4}>邮件监控</Title>
          <Tooltip label={themeLabel}>
            <ActionIcon variant="light" onClick={toggleTheme} size="lg">
              {themeIcon}
            </ActionIcon>
          </Tooltip>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="xs">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            label={item.label}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            variant="light"
          />
        ))}
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
