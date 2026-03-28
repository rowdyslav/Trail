# Architecture

## Обзор

Проект — клиентское приложение на `React + TypeScript + Vite` с FSD-подобной структурой и `Tailwind` для UI.

Ключевые продуктовые сценарии:
- пользователь изучает маршруты через каталог;
- проходит активный маршрут с картой и геолокацией;
- открывает точки маршрута через универсальную QR-страницу `/activate/:token`;
- накапливает `XP`, streak и reward points;
- входит в аккаунт, чтобы получить доступ к защищённым разделам;
- обменивает баллы на призы через redemption flow;
- администратор подтверждает выдачу по коду в отдельной админ-зоне.

Архитектурно проект остаётся frontend-first, но ключевые бизнес-сценарии авторизации, redemption и активации точек маршрута работают через backend API.

## Технологический стек

- `React 19`
- `TypeScript`
- `Vite`
- `react-router-dom`
- `zustand`
- `tailwindcss`
- `react-leaflet` + `leaflet`
- Browser APIs: `Geolocation`

## Структура слоёв

### `src/app`

- `App.tsx` — корневой React-компонент, инициализация auth и hydration зависимых данных.
- `router.tsx` — единое описание роутов приложения.
- `layout/AppShell.tsx` — пользовательский shell: header, нижняя навигация, `RewardModal`.
- `layout/AdminLayout.tsx` — отдельный layout для админ-зоны.

`app` отвечает за сборку приложения и orchestration верхнего уровня, но не хранит внутри себя бизнес-логику.

### `src/pages`

Страницы собирают сценарии из feature- и shared-модулей:

- `home/HomePage.tsx` — главная страница.
- `catalog/CatalogPage.tsx` — каталог маршрутов.
- `route/RoutePage.tsx` — экран активного маршрута с картой.
- `activate/ActivatePointPage.tsx` — универсальная страница активации точки по токену из URL.
- `profile/ProfilePage.tsx` — профиль, прогресс, баллы, активный redemption.
- `redeem/RedeemPage.tsx` — выбор приза и старт redemption flow.
- `redeem/RedeemConfirmPage.tsx` — подтверждение состава заявки.
- `redeem/RedeemResultPage.tsx` — экран с итоговым кодом выдачи.
- `auth/AuthPage.tsx` — вход и регистрация пользователя.
- `admin/AdminLoginPage.tsx` — backend-вход администратора.
- `admin/AdminRedemptionsPage.tsx` — поиск и подтверждение выдачи приза.

### `src/features`

#### `features/auth`

- `api/authApi.ts` — клиент для `/auth/register`, `/auth/login`, `/me`.
- `model/useAuthStore.ts` — пользовательская auth-сессия и профиль.
- `ui/RequireAuth.tsx` — guard для защищённых пользовательских роутов.

`useAuthStore` отвечает за:
- `authToken`
- `user`
- `isAuthReady`
- `isAuthLoading`
- `initializeAuth`
- `loginUser`
- `registerUser`
- `logoutUser`
- `refreshMe`
- `updateUser`

#### `features/admin`

- `model/useAdminStore.ts` — admin session и backend admin login.

#### `features/game`

- `model/useRouteProgressStore.ts` — активный маршрут и каталог маршрутов.

Важно: store больше не валидирует QR-коды локально и не управляет scanner UI.

#### `features/navigation`

- `model/routePoints.ts` — конфигурация точек маршрута и destination ids.
- `ui/RouteMap.tsx` — карта маршрута на `react-leaflet`.

#### `features/scan`

- `api/scanApi.ts` — backend-клиент для `POST /scan`.
- `model/useActivatePoint.ts` — асинхронная логика universal activation flow.

Текущий scan-domain больше не содержит camera UI, `BarcodeDetector`, overlay или локальную проверку `checkpoint.id`.

#### `features/rewards`

- `model/useRewardStore.ts` — состояние модалки награды.
- `ui/RewardModal.tsx` — модальное окно награды.

#### `features/redemption`

- `api/prizesApi.ts` — `/prizes`
- `api/redemptionsApi.ts` — пользовательские `/redemptions`
- `api/adminRedemptionsApi.ts` — admin `/admin/redemptions/{code}`
- `model/useRedemptionStore.ts` — пользовательский redemption flow
- `model/useAdminRedemptionStore.ts` — admin redemption actions
- `ui/*` — формы, карточки и summary-компоненты redemption-сценария

### `src/entities`

- `quest/model/mockData.ts` — mock-данные для маршрута, каталога маршрутов, профиля, наград и витринных блоков.

### `src/shared`

- `api/http.ts` — общий HTTP-клиент и `ApiError`.
- `lib/cn.ts` — helper для объединения классов.
- `lib/useCurrentGeolocation.ts` — хук чтения текущей геолокации.
- `lib/sessionExpiration.ts` — обработка истечения пользовательской и админской сессии.
- `lib/avatarByStreakKey.ts` — соответствие `streakKey -> avatar image/label`.
- `types/game.ts` — основные доменные типы.
- `ui/Button.tsx` — базовый UI-компонент.

## Маршрутизация

Роутинг описан в `src/app/router.tsx` через `createBrowserRouter`.

### Пользовательская зона

Вся пользовательская часть обёрнута в `AppShell`:
- `/` — главная
- `/auth` — вход / регистрация
- `/activate` — fallback universal activation route по query-параметру `token`
- `/activate/:token` — основной universal activation route
- `/routes` — каталог маршрутов
- `/route` — активный маршрут
- `/profile` — профиль, защищённый `RequireAuth`
- `/redeem` — выбор приза, защищённый `RequireAuth`
- `/redeem/confirm` — подтверждение заявки, защищённый `RequireAuth`
- `/redeem/:requestId` — просмотр кода выдачи, защищённый `RequireAuth`

### Админ-зона

- `/admin/login` — вход администратора
- `/admin/redemptions` — рабочий экран выдачи

## Источники данных

### Mock data

Основной источник локальных данных — `src/entities/quest/model/mockData.ts`.

Из него инициализируются:
- активный маршрут;
- каталог маршрутов;
- базовый профиль по умолчанию до авторизации;
- витринные и визуальные данные.

### API

Backend используется для следующих сценариев:
- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `POST /admin/session`
- `GET /prizes`
- `POST /redemptions`
- `GET /redemptions/{code}`
- `DELETE /redemptions/{code}`
- `GET /admin/redemptions/{code}`
- `PATCH /admin/redemptions/{code}`
- `POST /scan`

Доступ к API идёт через `src/shared/api/http.ts`. Базовый URL берётся из `VITE_API_BASE_URL`, fallback — `http://localhost:8000`.

## Управление состоянием

Приложение использует несколько доменных `zustand` store.

### `useAuthStore`

Хранит:
- `user`
- `authToken`
- `isAuthReady`
- `isAuthLoading`

### `useAdminStore`

Хранит:
- `adminSession`

### `useRouteProgressStore`

Хранит:
- `route`
- `catalogRoutes`

### `useRewardStore`

Хранит:
- `activeReward`

### `useRedemptionStore`

Хранит:
- `prizeCatalog`
- `redemptions`
- `redemptionDraftItems`
- `isPrizeCatalogLoading`

### `useAdminRedemptionStore`

Не хранит долгоживущих коллекций, а инкапсулирует admin actions по кодам.

## Основные пользовательские флоу

### 1. Активация точки маршрута

1. Пользователь открывает физический QR-линк вида `/activate/:token`.
2. `ActivatePointPage` читает токен из path params или query params.
3. Если пользователь не авторизован, показывается state `unauthorized` с CTA на `/auth`.
4. Если пользователь авторизован, `useActivatePoint` вызывает `scanApi.activate`.
5. Backend валидирует токен и применяет бизнес-логику.
6. Frontend показывает одно из состояний: `loading`, `success`, `duplicate`, `invalid`, `unauthorized`, `error`.
7. При успехе `useAuthStore` синхронизирует streak и reward points пользователя из backend-ответа.

### 2. Пользовательская авторизация

1. Пользователь открывает `/auth`.
2. Страница вызывает `loginUser` или `registerUser` из `useAuthStore`.
3. Store обращается к `authApi`.
4. Access token сохраняется в `localStorage`.
5. После ответа auth flow гидратирует профиль и данные redemption.
6. Защищённые страницы становятся доступны через `RequireAuth`.

### 3. Пользовательский redemption flow

1. Пользователь открывает `/redeem`.
2. `useRedemptionStore` получает каталог призов из backend `/prizes`.
3. Пользователь выбирает приз и количество.
4. `createRedemptionRequest` делает `POST /redemptions`.
5. Backend возвращает реальный redemption code.
6. Пользователь получает экран `/redeem/:requestId`.
7. Активный код также доступен в профиле.
8. При необходимости пользователь может отменить текущий код через `DELETE /redemptions/{code}`.

### 4. Админский redemption flow

1. Администратор входит через `/admin/login`.
2. `useAdminStore` получает token через `/admin/session`.
3. На `/admin/redemptions` вводится redemption code.
4. `useAdminRedemptionStore` делает `GET /admin/redemptions/{code}`.
5. После проверки администратор подтверждает выдачу.
6. `useAdminRedemptionStore` делает `PATCH /admin/redemptions/{code}`.

## Границы ответственности

- `app` — сборка приложения, router, layout, orchestration инициализации.
- `pages` — композиция экранов.
- `features` — сценарии и прикладная логика.
- `entities` — доменные mock-данные и сущности.
- `shared` — технические утилиты, базовые типы и UI.

Отдельно важно сохранять границы между store:
- auth не должен держать admin session;
- route progress не должен валидировать QR локально;
- scan feature не должна возвращаться к camera overlay без новой задачи;
- reward modal не должен знать про redemption или admin flow;
- admin redemption actions не должны жить в пользовательском redemption store.

## Текущее направление проекта

Текущая архитектура строится вокруг трёх подсистем:
- exploration: каталог, маршрут, карта, активация точек через universal URL;
- account: регистрация, логин, профиль, streak, аватар, прогресс;
- rewards: баллы, redemption code, админ-подтверждение выдачи.

Последний крупный архитектурный шаг — отказ от in-app scanner UI в пользу одного backend-driven activation route. Любые новые изменения должны поддерживать этот подход, а не возвращать проект к camera-overlay и локальной валидации QR.
