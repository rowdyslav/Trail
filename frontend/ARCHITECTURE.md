# Architecture

## Обзор

Проект — клиентское приложение на `React + TypeScript + Vite` с FSD-подобной структурой и `Tailwind` для UI. Основной продуктовый сценарий уже шире первоначального MVP:

- пользователь изучает маршруты через каталог;
- проходит активный маршрут с картой, геолокацией и QR-сканированием;
- накапливает `XP` и reward points;
- входит в аккаунт, чтобы получить доступ к защищённым разделам;
- обменивает баллы на призы через redemption flow;
- администратор подтверждает выдачу по коду в отдельной админ-зоне.

Архитектурно проект остаётся frontend-first: большая часть игрового состояния живёт в локальном `zustand` store, а реальная серверная интеграция сейчас используется в первую очередь для пользовательской авторизации.

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

- `App.tsx` — корневой React-компонент.
- `router.tsx` — единое описание роутов приложения.
- `layout/AppShell.tsx` — пользовательский shell: header, нижняя навигация, `ScanOverlay`, `RewardModal`.
- `layout/AdminLayout.tsx` — отдельный layout для админ-зоны.

`app` отвечает за глобальную сборку приложения и layout-оболочки, но не хранит доменную логику.

### `src/pages`

Страницы собирают сценарии из feature- и shared-модулей:

- `home/HomePage.tsx` — главная страница, промо-блок, вход в пользовательские сценарии.
- `catalog/RoutesCatalogPage.tsx` — каталог бесплатных и платных маршрутов.
- `route/RoutePage.tsx` — экран активного маршрута с картой и landmark-блоками.
- `profile/ProfilePage.tsx` — профиль, прогресс, баллы, бейджи, активный redemption.
- `redeem/RedeemPage.tsx` — выбор приза и старт redemption flow.
- `redeem/RedeemConfirmPage.tsx` — подтверждение состава заявки.
- `redeem/RedeemResultPage.tsx` — экран с итоговым кодом выдачи.
- `auth/AuthPage.tsx` — вход и регистрация пользователя.
- `admin/AdminLoginPage.tsx` — локальный вход администратора.
- `admin/AdminRedemptionsPage.tsx` — поиск и подтверждение выдачи приза.

### `src/features`

#### `features/game`

- `model/useGameStore.ts` — центральный `zustand` store приложения.

Store объединяет несколько доменных направлений:

- активный маршрут и прогресс по чекпоинтам;
- профиль пользователя, XP, уровень и balance reward points;
- состояние QR-сканирования и модалки награды;
- каталог маршрутов;
- каталог призов;
- черновик redemption и список заявок;
- пользовательскую auth-сессию;
- локальную admin-сессию.

Это главный узел состояния приложения. Большинство cross-feature сценариев проходят через него.

#### `features/auth`

- `api/authApi.ts` — клиент для `/auth/register`, `/auth/login`, `/me`.
- `ui/RequireAuth.tsx` — guard для защищённых пользовательских роутов.

Auth-фича является исключением из общего mock-first подхода: для пользовательской сессии уже используется реальный API через общий HTTP-клиент.

#### `features/navigation`

- `model/routePoints.ts` — конфигурация точек маршрута и destination ids.
- `ui/RouteMap.tsx` — карта маршрута на `react-leaflet`.

Фича отвечает за вычисление и отображение маршрута, использует конфиг точек и текущую геолокацию пользователя.

#### `features/scan`

- `model/qrPayload.ts` — формат и проверка QR payload.
- `model/useQrScanner.ts` — работа с камерой и `BarcodeDetector`.
- `ui/ScanOverlay.tsx` — UI-оболочка сценария сканирования.

Сканирование связано с `useGameStore`: успешный QR меняет статус checkpoint и запускает награду.

#### `features/rewards`

- `ui/RewardModal.tsx` — модальное окно награды после успешного checkpoint scan.

#### `features/redemption`

- `lib/getRedemptionDraftSummary.ts` — вычисление totals по черновику заявки.
- `ui/PrizeCatalogCard.tsx`
- `ui/PrizeSelectionSummary.tsx`
- `ui/RedemptionConfirmationCard.tsx`
- `ui/ActiveRedemptionCard.tsx`
- `ui/AdminCodeLookupForm.tsx`
- `ui/AdminRedemptionDetailsCard.tsx`

Фича покрывает как пользовательский обмен баллов на призы, так и административное подтверждение выдачи.

### `src/entities`

- `quest/model/mockData.ts` — основной источник mock-данных для маршрутов, пользователя, профиля, призов и тестовых redemption-сценариев.

Entities-слой пока компактный и в основном хранит исходные доменные данные для MVP-логики.

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

`AppShell` централизует общие пользовательские элементы UI и overlay-потоки.

### Админ-зона

Админ-роуты вынесены отдельно:

- `/admin/login` — вход администратора
- `/admin/redemptions` — рабочий экран выдачи

`/admin` редиректит на `/admin/redemptions`, а доступ контролируется через локальную `adminSession` в store и `AdminLayout`.

## Источники данных

### Mock data

Основной источник игровых и витринных данных — `src/entities/quest/model/mockData.ts`.

Из него инициализируются:

- активный маршрут;
- каталог маршрутов;
- профиль и прогресс пользователя по умолчанию;
- каталог призов;
- тестовые redemption requests;
- визуальные и метаданные для профиля.

### API

Сейчас реальное сетевое взаимодействие ограничено auth-сценарием:

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`

Доступ к API идёт через `src/shared/api/http.ts`. Базовый URL берётся из `VITE_API_BASE_URL`, fallback — `http://localhost:8000`.

## Управление состоянием

Главное хранилище — `useGameStore`.

### Что хранится в store

- `route`
- `catalogRoutes`
- `prizeCatalog`
- `redemptions`
- `redemptionDraftItems`
- `user`
- `isScanOpen`
- `isScanning`
- `activeReward`
- `adminSession`
- `authToken`
- `isAuthReady`
- `isAuthLoading`

### Ключевые действия store

- `openScan`, `closeScan`, `setScanning`
- `completeScan`
- `setRedemptionDraftItem`, `clearRedemptionDraft`
- `createRedemptionRequest`
- `getActiveRedemptionForCurrentUser`, `getRedemptionById`, `findRedemptionByCode`
- `loginAdmin`, `logoutAdmin`, `confirmRedemptionIssuance`
- `initializeAuth`, `loginUser`, `registerUser`, `logoutUser`, `refreshMe`

Store играет роль orchestrator-слоя между экраном, mock-данными, auth API и overlay-состояниями.

## Основные пользовательские флоу

### 1. Прохождение маршрута

1. Пользователь открывает `/route`.
2. `RouteMap` строит маршрут на основе конфигурации точек и текущей геолокации.
3. Через `ScanOverlay` запускается QR-сканирование.
4. `useQrScanner` читает QR-код через камеру и `BarcodeDetector`.
5. `completeScan` в store валидирует текущий checkpoint через `matchesCheckpointQr`.
6. После успеха обновляются checkpoint status, progress, XP, points и `activeReward`.
7. `RewardModal` показывает награду поверх общего shell.

### 2. Пользовательская авторизация

1. Пользователь открывает `/auth`.
2. Страница вызывает `loginUser` или `registerUser` из store.
3. Store обращается к `authApi`.
4. Access token сохраняется в `localStorage`.
5. Store подгружает `/me` и маппит API-профиль в локальный `UserProfile`.
6. Защищённые страницы доступны через `RequireAuth`.

### 3. Redemption flow

1. Пользователь открывает `/redeem`.
2. Выбирает приз и количество.
3. Store создаёт redemption request и уменьшает reward points balance.
4. Пользователь получает экран `/redeem/:requestId` с кодом выдачи.
5. Администратор вводит код в `/admin/redemptions`.
6. Store находит заявку и подтверждает выдачу через `confirmRedemptionIssuance`.

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

- `app` — сборка приложения, router, layout.
- `pages` — композиция экранов.
- `features` — сценарии и прикладная логика.
- `entities` — доменные mock-данные и сущности.
- `shared` — технические утилиты, базовые типы и UI.

Важно сохранять эти границы: не переносить глобальный layout в страницы, не вшивать маршрутные координаты в JSX и не размножать параллельные store/API-слои без необходимости.

## Текущее направление проекта

Проект уже не ограничивается только маршрутом и профилем. На текущем этапе его можно описывать как игровой туристический frontend с тремя связанными подсистемами:

- exploration: каталог, маршрут, карта, QR-чекпоинты;
- account: регистрация, логин, профиль, прогресс;
- rewards: баллы, redemption code, админ-подтверждение выдачи.

Любые архитектурные изменения нужно синхронизировать с `AGENTS.md`, потому что этот документ задаёт рабочие правила для следующих правок.
