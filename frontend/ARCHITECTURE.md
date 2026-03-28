# Architecture

## Обзор

Проект — клиентское приложение на `React + TypeScript + Vite` с FSD-подобной структурой и `Tailwind` для UI.

Ключевые продуктовые сценарии:
- пользователь изучает маршруты через каталог;
- проходит активный маршрут с картой и геолокацией;
- открывает точки маршрута через универсальную QR-страницу `/activate/:token`;
- накапливает `XP`, streak и reward points;
- входит в аккаунт, чтобы получить доступ к защищённым разделам;
- обменивает баллы на призы через code flow;
- администратор подтверждает выдачу по коду в отдельной админ-зоне.

Архитектурно проект остаётся frontend-first в части UI и композиции экранов, но сценарии маршрутов, авторизации, code и активации точек маршрута опираются на backend API.

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
- `layout/AppShell.tsx` — пользовательский shell: header, нижняя навигация.
- `layout/AdminLayout.tsx` — отдельный layout для админ-зоны.

`app` отвечает за сборку приложения и orchestration верхнего уровня, но не хранит внутри себя бизнес-логику.

### `src/pages`

Страницы собирают сценарии из feature- и shared-модулей:

- `home/HomePage.tsx` — главная страница; блок текущей цели показывается только авторизованному пользователю.
- `catalog/CatalogPage.tsx` — каталог маршрутов.
- `route/RoutePage.tsx` — экран временного preview или активного маршрута с картой для авторизованного пользователя.
- `activate/ActivatePointPage.tsx` — универсальная страница активации точки по токену из URL.
- `profile/ProfilePage.tsx` — профиль, прогресс, баллы, активный code.
- `redeem/RedeemPage.tsx` — выбор приза и старт code flow.
- `redeem/RedeemConfirmPage.tsx` — подтверждение состава заявки.
- `redeem/RedeemResultPage.tsx` — экран с итоговым кодом выдачи.
- `auth/AuthPage.tsx` — вход и регистрация пользователя.
- `admin/AdminLoginPage.tsx` — backend-вход администратора.
- `admin/AdminCodesPage.tsx` — поиск и подтверждение выдачи приза.

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

Важно: `user` инициализируется локальным `emptyUser`, а не backend-подобным mock-профилем. После логина store синхронизирует `/me`, включая `active_route_id`, `purchased_route_ids` и `active_codes`.

#### `features/admin`

- `model/useAdminStore.ts` — admin session и backend admin login.

#### `features/game`

- `model/useRouteProgressStore.ts` — активный маршрут, публичный каталог маршрутов, preview/selection/purchase flow.

`useRouteProgressStore` отвечает за:
- публичную загрузку каталога через `/routes`;
- использование viewer-state полей из `/routes` и `/routes/{route_id}`, если backend вернул их для текущего пользователя;
- fallback на `active_route_id` и `purchased_route_ids` из `/me`, если route endpoint не отдал viewer state;
- временный preview маршрута через `previewRouteId`;
- хранение реально выбранного маршрута через `selectedRouteId`;
- выбор активного маршрута;
- оплату маршрута, подтверждение оплаты и автоматический выбор маршрута после успешного confirm;
- синхронизацию route-state из профиля через `syncRouteStateFromProfile`.

Важно: store больше не валидирует QR-коды локально, не управляет scanner UI и не хранит статический конфиг точек маршрута.

#### `features/navigation`

- `api/routesApi.ts` — клиент для публичных route endpoints и auth-only select / payment endpoints, плюс маппинг backend `places` в `RouteDetails`, `RoutePoint`, `CatalogRoute`.
- `ui/RouteMap.tsx` — карта маршрута на `react-leaflet`.

`RouteMap` строит линию маршрута по ordered-цепочке backend-точек:
- первая точка массива `route.routePoints` — старт;
- последняя точка массива `route.routePoints` — финал;
- геолокация пользователя отображается отдельным маркером и не участвует в построении линии;
- при наличии OSRM используется дорожная геометрия через все waypoints одним запросом;
- при ошибке OSRM используется fallback polyline по тем же точкам;
- карта не строит ссылки активации из `places`, потому что `activation_token` не приходит с маршрутом.

#### `features/scan`

- `api/scanApi.ts` — backend-клиент для `POST /scan`.
- `model/useActivatePoint.ts` — асинхронная логика universal activation flow.

Текущий scan-domain не содержит camera UI, `BarcodeDetector`, overlay или локальную проверку `checkpoint.id`.

#### `features/code`

- `api/prizesApi.ts` — `/prizes`.
- `api/codesApi.ts` — пользовательские `/codes`.
- `api/adminCodesApi.ts` — admin `/admin/codes/{code}`.
- `model/useCodeStore.ts` — пользовательский code flow.
- `model/useAdminCodeStore.ts` — admin code actions.
- `ui/*` — формы, карточки и summary-компоненты code-сценария.

### `src/entities`

- `quest/model/mockData.ts` — локальные витринные данные интерфейса, которые не приходят с backend (`profileStats`, `upgradeItems`).

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
- `/` — главная;
- `/auth` — вход / регистрация;
- `/activate` — fallback universal activation route по query-параметру `token`;
- `/activate/:token` — основной universal activation route;
- `/routes` — публичный каталог маршрутов;
- `/route` — экран preview или активного маршрута для авторизованного пользователя; для гостя показывает только CTA на вход;
- `/profile` — профиль, защищённый `RequireAuth`;
- `/redeem` — выбор приза, защищённый `RequireAuth`;
- `/redeem/confirm` — подтверждение заявки, защищённый `RequireAuth`;
- `/redeem/:code` — просмотр кода выдачи, защищённый `RequireAuth`.

### Админ-зона

- `/admin/login` — вход администратора;
- `/admin/codes` — рабочий экран выдачи.

## Источники данных

### Mock data

`src/entities/quest/model/mockData.ts` больше не инициализирует backend-домены.

Из него берутся только локальные витринные данные:
- `profileStats`;
- `upgradeItems`.

Профиль пользователя, каталог маршрутов, выбранный маршрут, купленные маршруты и коллекции code всегда должны приходить из store и backend API, а не из mock data.

### API

Backend используется для следующих сценариев:
- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `POST /admin/session`
- `GET /routes`
- `GET /routes/{route_id}`
- `POST /routes/{route_id}/select`
- `POST /routes/{route_id}/payments`
- `POST /routes/{route_id}/payments/confirm`
- `GET /prizes`
- `POST /codes`
- `GET /codes/{code}`
- `DELETE /codes/{code}`
- `GET /admin/codes/{code}`
- `PATCH /admin/codes/{code}`
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
- `selectedRouteId`
- `previewRouteId`
- `hasRouteSelection`
- `catalogRoutes`
- `isCatalogLoading`
- `isRouteActionLoading`
- `catalogError`
- `routeActionError`
- `activeRouteTypeFilter`

Инкапсулирует действия:
- `loadCatalogRoutes`
- `previewRoute`
- `clearPreviewRoute`
- `selectRoute`
- `purchaseRoute`
- `confirmRoutePurchase`
- `syncRouteStateFromProfile`

`catalogRoutes` и начальный route-state больше не инициализируются из mock data. Если `/routes` не прислал viewer state, store использует fallback из `/me`.

### `useCodeStore`

Хранит:
- `prizeCatalog`
- `codes`
- `codeDraftItems`
- `isPrizeCatalogLoading`

Коллекция code инициализируется пустым массивом и гидратируется из backend-данных пользователя. Допускается fallback на legacy-поле `active_redemptions` только для совместимости с устаревшим ответом `/me`.

### `useAdminCodeStore`

Не хранит долгоживущих коллекций, а инкапсулирует admin actions по кодам через `/admin/codes/{code}`.

## Основные пользовательские флоу

### 1. Активация точки маршрута

1. Пользователь открывает физический QR-линк вида `/activate/:token`.
2. `ActivatePointPage` читает токен из path params или query params.
3. Если пользователь не авторизован, показывается state `unauthorized` с CTA на `/auth`.
4. Если пользователь авторизован, `useActivatePoint` вызывает `scanApi.activate`.
5. Backend валидирует токен и применяет бизнес-логику.
6. Frontend показывает одно из состояний: `loading`, `success`, `duplicate`, `invalid`, `unauthorized`, `error`.
7. При успехе `useAuthStore` синхронизирует streak, avatar state и reward points пользователя из backend-ответа `/scan`.

### 2. Каталог маршрутов, preview, выбор и покупка

1. Пользователь открывает `/routes`.
2. `CatalogPage` вызывает `loadCatalogRoutes` из `useRouteProgressStore`.
3. Store получает публичные маршруты через `GET /routes`.
4. Если backend отдал персонализированные поля маршрута (`is_purchased`, `is_available`, `is_active`, `is_completed`, `scanned_places_count`), store использует их как источник истины.
5. Если route endpoint не отдал viewer state, store может восстановить `activeRouteId` и `purchasedRouteIds` из `/me`, но не из mock data.
6. Пользователь может открыть временный preview маршрута через `previewRoute`; store записывает только `previewRouteId`, не превращая маршрут в selected.
7. На `/route` приоритет отображения такой: preview route, затем selected/active route, затем empty state.
8. Авторизованный пользователь может выбрать доступный маршрут через `POST /routes/{route_id}/select`.
9. Для платного маршрута запускается `POST /routes/{route_id}/payments`; если backend вернул `confirmation_url`, пользователь уходит на оплату.
10. После возврата на `/routes?purchase_route_id=...` или `/route?purchase_route_id=...` фронтенд вызывает `confirmRoutePurchase`.
11. Store подтверждает оплату через `/payments/confirm`, затем сразу вызывает `/select`, обновляет `/me` и повторно синхронизирует каталог и конкретный маршрут.
12. Пользователь попадает на `/route` уже с активным и доступным маршрутом.

### 3. Пользовательская авторизация

1. Пользователь открывает `/auth`.
2. Страница вызывает `loginUser` или `registerUser` из `useAuthStore`.
3. Store обращается к `authApi`.
4. Access token сохраняется в `localStorage`.
5. После ответа auth flow гидратирует профиль и зависимые пользовательские данные, включая встроенные route-state поля и active codes.
6. Защищённые страницы становятся доступны через `RequireAuth`.

### 4. Пользовательский code flow

1. Пользователь открывает `/redeem`.
2. `useCodeStore` получает каталог призов из backend `/prizes`.
3. Пользователь выбирает приз и количество.
4. `createCode` делает `POST /codes`.
5. Backend возвращает реальный code.
6. Пользователь получает экран `/redeem/:code`.
7. Активный код также доступен в профиле.
8. При необходимости пользователь может отменить текущий код через `DELETE /codes/{code}`.

### 5. Админский code flow

1. Администратор входит через `/admin/login`.
2. `useAdminStore` получает token через `/admin/session`.
3. На `/admin/codes` вводится code.
4. `useAdminCodeStore` делает `GET /admin/codes/{code}`.
5. После проверки администратор подтверждает выдачу.
6. `useAdminCodeStore` делает `PATCH /admin/codes/{code}`.

## Границы ответственности

- `app` — сборка приложения, router, layout, orchestration инициализации.
- `pages` — композиция экранов.
- `features` — сценарии и прикладная логика.
- `entities` — локальные витринные данные и доменные сущности.
- `shared` — технические утилиты, базовые типы и UI.

Отдельно важно сохранять границы между store:
- auth не должен держать admin session;
- route progress не должен валидировать QR локально;
- route progress не должен возвращаться к статическому `routePoints.ts` или локальному конфигу маршрутов;
- scan feature не должна возвращаться к camera overlay без новой задачи;
- user-facing home goal не должен отображаться гостю;
- reward/modal UI не должен знать про code или admin flow;
- admin code actions не должны жить в пользовательском code store.

## Текущее направление проекта

Текущая архитектура строится вокруг трёх подсистем:
- exploration: каталог, маршрут, карта, активация точек через universal URL;
- account: регистрация, логин, профиль, streak, аватар, прогресс;
- rewards: баллы, code, админ-подтверждение выдачи.

Последние архитектурные шаги:
- отказ от in-app scanner UI в пользу одного backend-driven activation route;
- перевод каталога и preview маршрутов на публичные backend endpoints;
- перевод точек карты на backend-driven `places` без статического route config;
- перенос viewer state маршрута в сами `RouteRead` и fallback на `/me`;
- переход пользовательского и админского prize flow с `redemption`-терминологии на `code`.

Любые новые изменения должны поддерживать этот подход, а не возвращать проект к camera-overlay, локальной валидации QR или второму источнику истины для маршрутов.
