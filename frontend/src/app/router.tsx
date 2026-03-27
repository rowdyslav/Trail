import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { AdminLayout } from './layout/AdminLayout'
import { HomePage } from '../pages/home/HomePage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { RoutePage } from '../pages/route/RoutePage'
import { RoutesCatalogPage } from '../pages/catalog/RoutesCatalogPage'
import { RedeemPage } from '../pages/redeem/RedeemPage'
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
      { path: 'routes', element: <RoutesCatalogPage /> },
      { path: 'route', element: <RoutePage /> },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      { path: 'redeem', element: <RedeemPage /> },
      { path: 'redeem/:requestId', element: <RedeemResultPage /> },
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
