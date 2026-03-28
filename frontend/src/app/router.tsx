import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { AdminLayout } from './layout/AdminLayout'
import { HomePage } from '../pages/home/HomePage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { RoutePage } from '../pages/route/RoutePage'
import { CatalogPage } from '../pages/catalog/CatalogPage.tsx'
import { AdminLoginPage } from '../pages/admin/AdminLoginPage'
import { AdminCodesPage } from '../pages/admin/AdminCodesPage'
import { AuthPage } from '../pages/auth/AuthPage'
import { ActivatePointPage } from '../pages/activate/ActivatePointPage'
import { RequireAuth } from '../features/auth/ui/RequireAuth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'auth', element: <AuthPage /> },
      { path: 'activate', element: <ActivatePointPage /> },
      { path: 'activate/:token', element: <ActivatePointPage /> },
      { path: 'routes', element: <CatalogPage /> },
      { path: 'route', element: <RoutePage /> },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      { path: 'redeem/*', element: <Navigate to="/profile" replace /> },
    ],
  },
  {
    path: '/admin',
    children: [
      { index: true, element: <Navigate to="/admin/codes" replace /> },
      { path: 'login', element: <AdminLoginPage /> },
      {
        element: <AdminLayout />,
        children: [{ path: 'codes', element: <AdminCodesPage /> }],
      },
    ],
  },
])
