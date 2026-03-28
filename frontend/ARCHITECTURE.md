# Architecture

## Обзор

Проект — клиентское приложение на `React + TypeScript + Vite` с FSD-подобной структурой и `Tailwind` для UI.

Ключевые продуктовые сценарии:

- пользователь изучает маршруты через каталог;
- проходит активный маршрут с картой, геолокацией и QR-сканированием;
- накапливает `XP` и reward points;
- входит в аккаунт, чтобы получить доступ к защищённым разделам;
- обменивает баллы на призы через redemption flow;
- администратор подтверждает выдачу по коду в отдельной админ-зоне.

Архитектурно проект остаётся frontend-first, но уже не строится вокруг одного общего store. Состояние разделено по доменным `zustand` store, а ключевые бизнес-сценарии авторизации, redemption и admin flow работают через backend API.

## Технологический стек

- `React 19`
- `TypeScript`
- `Vite`
- `react-router-dom`
- `zustand`
- `tailwindcss`
- `react-leaflet` + `leaflet`
- Browser APIs: `Geolocation`, `MediaDevices`, `BarcodeDetector`

## Структура слоёв

### `src/app`

- `App.tsx` — корневой React-компонент, инициализация auth + hydration зависимых данных.
- `router.tsx` — единое описание роутов приложения.
- `layout/AppShell.tsx` — пользовательский shell: header, нижняя навигация, `ScanOverlay`, `RewardModal`.
- `layout/AdminLayout.tsx` — отдельный layout для админ-зоны.

`app` отвечает за сборку приложения и orchestration верхнего уровня, но не хранит бизнес-логику внутри себя.

### `src/pages`

Страницы собирают сценарии из feature- и shared-модулей:

- `home/HomePage.tsx` — главная страница, промо-блок, вход в пользовательские сценарии.
- `catalog/CatalogPage.tsx` — каталог бесплатных и платных маршрутов.
- `route/RoutePage.tsx` — экран активного маршрута с картой и landmark-блоками.
- `profile/ProfilePage.tsx` — профиль, прогресс, баллы, бейджи, активный redemption.
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

`useAdminStore` изолирует админскую авторизацию от пользовательской части приложения.

#### `features/game`

- `model/useRouteProgressStore.ts` — активный маршрут, каталог маршрутов и прогресс по checkpoint.

Store отвечает за:

- `route`
- `catalogRoutes`
- `completeScan`

Этот store больше не хранит auth/admin/redemption UI-state.

#### `features/navigation`

- `model/routePoints.ts` — конфигурация точек маршрута и destination ids.
- `ui/RouteMap.tsx` — карта маршрута на `react-leaflet`.

Фича отвечает за вычисление и отображение маршрута, использует конфиг точек и текущую геолокацию пользователя.

#### `features/scan`

- `model/qrPayload.ts` — формат и проверка QR payload.
- `model/useQrScanner.ts` — работа с камерой и `BarcodeDetector`.
- `model/useScanUiStore.ts` — UI-state сканирования.
- `ui/ScanOverlay.tsx` — UI-оболочка сценария сканирования.

Сканирование разделено на:

- прикладную логику прогресса маршрута в `useRouteProgressStore`;
- UI-state открытия/закрытия и активности камеры в `useScanUiStore`.

#### `features/rewards`

- `model/useRewardStore.ts` — состояние модалки награды.
- `ui/RewardModal.tsx` — модальное окно награды после успешного checkpoint scan.

#### `features/redemption`

- `api/prizesApi.ts` — `/prizes`
- `api/redemptionsApi.ts` — пользовательские `/redemptions`
- `api/adminRedemptionsApi.ts` — admin `/admin/redemptions/{code}`
- `lib/getRedemptionDraftSummary.ts` — вычисление totals по черновику заявки
- `model/useRedemptionStore.ts` — пользовательский redemption flow
- `model/useAdminRedemptionStore.ts` — admin redemption actions
- `ui/PrizeCatalogCard.tsx`
- `ui/PrizeSelectionSummary.tsx`
- `ui/RedemptionConfirmationCard.tsx`
- `ui/ActiveRedemptionCard.tsx`
- `ui/AdminCodeLookupForm.tsx`
- `ui/AdminRedemptionDetailsCard.tsx`

`useRedemptionStore` отвечает за:

- `prizeCatalog`
- `redemptions`
- `redemptionDraftItems`
- `isPrizeCatalogLoading`
- `fetchPrizeCatalog`
- `hydrateActiveRedemptions`
- `setRedemptionDraftItem`
- `clearRedemptionDraft`
- `clearRedemptionData`
- `createRedemptionRequest`
- `getActiveRedemptionForCurrentUser`
- `getRedemptionById`
- `findRedemptionByCode`

`useAdminRedemptionStore` отвечает только за:

- чтение redemption code по backend;
- подтверждение выдачи redemption code.

### `src/entities`

- `quest/model/mockData.ts` — mock-данные для маршрута, каталога маршрутов, профиля, наград и визуальных блоков.

Этот слой остаётся источником демо-данных для exploration/profile части, но не для auth/redemption/admin backend flow.

### `src/shared`

- `api/http.ts` — общий HTTP-клиент и `ApiError`.
- `lib/cn.ts` — helper для объединения классов.
- `lib/useCurrentGeolocation.ts` — хук чтения текущей геолокации.
- `types/game.ts` — основные доменные типы.
- `types/barcode-detector.d.ts` — типы для `BarcodeDetector`.
- `ui/Button.tsx` — базовый UI-компонент.

`shared` содержит базовые инструменты без продуктовой привязки.

## Маршрутизация

Роутинг описан в `src/app/router.tsx` через `createBrowserRouter`.

### Пользовательская зона

Вся пользовательская часть обёрнута в `AppShell`:

- `/` — главная
- `/auth` — вход / регистрация
- `/routes` — каталог маршрутов
- `/route` — активный маршрут
- `/profile` — профиль, защищённый `RequireAuth`
- `/redeem` — выбор приза, защищённый `RequireAuth`
- `/redeem/confirm` — подтверждение заявки, защищённый `RequireAuth`
- `/redeem/:requestId` — просмотр кода выдачи, защищённый `RequireAuth`

### Админ-зона

Админ-роуты вынесены отдельно:

- `/admin/login` — вход администратора
- `/admin/redemptions` — рабочий экран выдачи

`/admin` редиректит на `/admin/redemptions`, а доступ контролируется через `useAdminStore` и `AdminLayout`.

## Источники данных

### Mock data

Основной источник локальных данных — `src/entities/quest/model/mockData.ts`.

Из него инициализируются:

- активный маршрут;
- каталог маршрутов;
- базовый профиль по умолчанию до авторизации;
- витринные и визуальные данные.

### API

Сейчас backend используется для следующих сценариев:

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `POST /admin/session`
- `GET /prizes`
- `POST /redemptions`
- `GET /redemptions/{code}`
- `GET /admin/redemptions/{code}`
- `PATCH /admin/redemptions/{code}`

Доступ к API идёт через `src/shared/api/http.ts`. Базовый URL берётся из `VITE_API_BASE_URL`, fallback — `http://localhost:8000`.

## Управление состоянием

Вместо одного store приложение теперь использует несколько доменных store.

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

### `useScanUiStore`

Хранит:

- `isScanOpen`
- `isScanning`

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

### 1. Прохождение маршрута

1. Пользователь открывает `/route`.
2. `RouteMap` строит маршрут на основе конфигурации точек и текущей геолокации.
3. Через `ScanOverlay` запускается QR-сканирование.
4. `useQrScanner` читает QR-код через камеру и `BarcodeDetector`.
5. `completeScan` в `useRouteProgressStore` валидирует checkpoint через `matchesCheckpointQr`.
6. `useAuthStore` обновляет пользователя: XP, level, reward points.
7. `useRewardStore` показывает награду.
8. `useScanUiStore` закрывает overlay.

### 2. Пользовательская авторизация

1. Пользователь открывает `/auth`.
2. Страница вызывает `loginUser` или `registerUser` из `useAuthStore`.
3. Store обращается к `authApi`.
4. Access token сохраняется в `localStorage`.
5. После ответа `App.tsx` и страницы auth гидратируют `useRedemptionStore` из `/me` и загружают `/prizes`.
6. Защищённые страницы доступны через `RequireAuth`.

### 3. Пользовательский redemption flow

1. Пользователь открывает `/redeem`.
2. `useRedemptionStore` предоставляет каталог призов из backend `/prizes`.
3. Пользователь выбирает приз и количество.
4. `createRedemptionRequest` делает `POST /redemptions`.
5. Backend возвращает реальный redemption code.
6. Пользователь получает экран `/redeem/:requestId`.
7. Активный код также доступен в профиле через `active_redemptions` из `/me`.

### 4. Админский redemption flow

1. Администратор входит через `/admin/login`.
2. `useAdminStore` получает token через `/admin/session`.
3. На `/admin/redemptions` вводится redemption code.
4. `useAdminRedemptionStore` делает `GET /admin/redemptions/{code}`.
5. После проверки администратор подтверждает выдачу.
6. `useAdminRedemptionStore` делает `PATCH /admin/redemptions/{code}`.

## Карта, геолокация и QR

### Геолокация

`useCurrentGeolocation` оборачивает `navigator.geolocation.getCurrentPosition` и возвращает:

- `coordinates`
- `error`
- `isLoading`
- `refresh`

### Карта

`RouteMap` использует:

- `react-leaflet` для визуализации;
- `routePoints` как источник конфигурации;
- текущую геолокацию как стартовую точку;
- внешний роутинг с fallback-логикой, если маршрут не удалось построить.

### QR-сканирование

`useQrScanner`:

- проверяет поддержку `BarcodeDetector`;
- запрашивает доступ к камере;
- циклически анализирует видео-кадры;
- передаёт найденный QR наверх через `onDetected`.

`qrPayload.ts` нормализует значение QR и позволяет принимать как полный URI, так и упрощённый `checkpointId`.

## Границы ответственности

- `app` — сборка приложения, router, layout, orchestration инициализации.
- `pages` — композиция экранов.
- `features` — сценарии и прикладная логика.
- `entities` — доменные mock-данные и сущности.
- `shared` — технические утилиты, базовые типы и UI.

Отдельно важно сохранять границы между store:

- auth не должен держать admin session;
- route progress не должен держать redemption draft;
- scan UI не должен держать профиль пользователя;
- reward modal не должен знать про маршрут;
- admin redemption actions не должны жить в пользовательском redemption store.

## Текущее направление проекта

Проект теперь можно описывать как игровой туристический frontend с тремя связанными подсистемами:

- exploration: каталог, маршрут, карта, QR-чекпоинты;
- account: регистрация, логин, профиль, прогресс;
- rewards: баллы, redemption code, админ-подтверждение выдачи.

Последний крупный архитектурный шаг — уход от `useGameStore` к набору доменных `zustand` store. Любые новые изменения должны поддерживать это разделение, а не возвращать проект к одному агрегирующему store.
