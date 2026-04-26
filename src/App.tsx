import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';
import { AppProvider } from './context/AppContext';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <AppProvider>
        <Router />
      </AppProvider>
    </MantineProvider>
  );
}
