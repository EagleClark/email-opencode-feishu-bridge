import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { EmailPage } from './pages/EmailPage';
import { SettingsPage } from './pages/SettingsPage';

const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <SettingsPage /> },
      { path: 'email', element: <EmailPage /> },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
