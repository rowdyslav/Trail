import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { AdminLayout } from './layout/AdminLayout'
import { HomePage } from '../pages/home/HomePage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { RoutePage } from '../pages/route/RoutePage'
import { CatalogPage } from '../pages/catalog/CatalogPage.tsx'
import { RedeemPage } from '../pages/redeem/RedeemPage'
import { RedeemConfirmPage } from '../pages/redeem/RedeemConfirmPage'
import { RedeemResultPage } from '../pages/redeem/RedeemResultPage'
import { AdminLoginPage } from '../pages/admin/AdminLoginPage'
import { AdminRedemptionsPage } from '../pages/admin/AdminRedemptionsPage'
import { AuthPage } from '../pages/auth/AuthPage'
import { RequireAuth } from '../features/auth/ui/RequireAuth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'auth', element: <AuthPage /> },
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
      {
        path: 'redeem',
        element: (
          <RequireAuth>
            <RedeemPage />
          </RequireAuth>
        ),
      },
      {
        path: 'redeem/confirm',
        element: (
          <RequireAuth>
            <RedeemConfirmPage />
          </RequireAuth>
        ),
      },
      {
        path: 'redeem/:requestId',
        element: (
          <RequireAuth>
            <RedeemResultPage />
          </RequireAuth>
        ),
      },
    ],
  },
  {
    path: '/admin',
    children: [
      { index: true, element: <Navigate to="/admin/redemptions" replace /> },
      { path: 'login', element: <AdminLoginPage /> },
      {
        element: <AdminLayout />,
        children: [{ path: 'redemptions', element: <AdminRedemptionsPage /> }],
      },
    ],
  },
])
