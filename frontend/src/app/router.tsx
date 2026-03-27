import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { HomePage } from '../pages/home/HomePage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { RoutePage } from '../pages/route/RoutePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'route', element: <RoutePage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
])
