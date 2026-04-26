import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { EmailPage } from './pages/EmailPage';
import { LogPage } from './pages/LogPage';
import { SettingsPage } from './pages/SettingsPage';

const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <SettingsPage /> },
      { path: 'email', element: <EmailPage /> },
      { path: 'log', element: <LogPage /> },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
