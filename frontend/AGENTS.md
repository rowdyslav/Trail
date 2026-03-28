# AGENTS.md

## Общие правила

- Используй `React + TypeScript` и функциональные компоненты.
- Держи код в рамках FSD-структуры: `app`, `pages`, `features`, `entities`, `shared`.
- Не добавляй лишнюю сложность. Новые абстракции, сервисы и инфраструктурные слои добавляй только если задача действительно этого требует.
- Предпочитай небольшие переиспользуемые компоненты, чистые хуки и явные типы вместо крупных файлов с плотной логикой.
- Перед созданием новой сущности проверь, нельзя ли расширить уже существующие модули: `features/auth`, `features/admin`, `features/game`, `features/navigation`, `features/code`, `features/scan`.

## UI и стили

- Основной способ стилизации: `Tailwind`.
- Глобальные токены, базовые стили и кастомные CSS-классы держи в `src/index.css`.
- Сохраняй текущий визуальный язык проекта: светлая палитра, мягкие карточки, зелёные акценты, округлые формы.
- Не дублируй общий layout на страницах. Пользовательский shell живёт в `src/app/layout/AppShell.tsx`, административный layout в `src/app/layout/AdminLayout.tsx`.
- Базовые переиспользуемые UI-элементы держи в `src/shared/ui`.
- При изменении интерфейса проверяй адаптивность: приложение должно корректно работать на мобильной ширине, так как текущий shell и нижняя навигация ориентированы на mobile-first сценарий.
- Universal activation page должна оставаться mobile-first и не требовать отдельного QR-scanner интерфейса внутри приложения.

## Состояние и данные

- Глобальное клиентское состояние держи в `zustand`, но не складывай новые сценарии в один общий store.
- Текущая архитектура состояния разделена по доменам:
- `src/features/auth/model/useAuthStore.ts`
- `src/features/admin/model/useAdminStore.ts`
- `src/features/game/model/useRouteProgressStore.ts`
- `src/features/code/model/useCodeStore.ts`
- `src/features/code/model/useAdminCodeStore.ts`
- Новую логику добавляй в соответствующий доменный store или feature-hook, а не создавай заново агрегирующий глобальный store.
- `src/entities/quest/model/mockData.ts` используй только для локальных витринных данных интерфейса, которые не приходят с backend. Не возвращай туда профиль пользователя, каталог маршрутов, активный маршрут, купленные маршруты и коды.
- Не дублируй HTTP-слой и не создавай новые fetch-обёртки поверх `src/shared/api/http.ts` без необходимости.
- Доменные типы держи в `src/shared/types/game.ts` и связанных `shared/types` файлах.
- Для аватара пользователя используй `streakKey` и соответствие из `src/shared/lib/avatarByStreakKey.ts`.

## Реальные API сценарии

Сейчас backend используется для:
- пользовательской авторизации;
- получения профиля `/me`;
- публичного каталога маршрутов `/routes`;
- публичного чтения маршрута `/routes/{route_id}`;
- выбора активного маршрута `/routes/{route_id}/select`;
- создания и подтверждения оплаты маршрута `/routes/{route_id}/payments` и `/routes/{route_id}/payments/confirm`;
- получения призов;
- создания и отмены code;
- админской авторизации;
- проверки и подтверждения code через `/admin/codes/{code}`;
- активации точки маршрута через universal endpoint `/scan`.

## Маршрутизация

- Маршрутизацию держи через `react-router-dom`.
- Роутер описывай в `src/app/router.tsx`.
- Пользовательские страницы должны жить внутри `AppShell`, административные страницы внутри `AdminLayout`.
- Не вставляй глобальный хидер, футер, нижнюю навигацию или overlay-компоненты прямо в страницы, если они уже подключены в layout.
- Защищённые пользовательские сценарии реализуй через `src/features/auth/ui/RequireAuth.tsx`, но не закрывай им публичный каталог маршрутов без отдельной причины.
- Экран `/route` сейчас работает как экран выбранного или временно просматриваемого маршрута только для авторизованного пользователя; для гостя он должен показывать CTA на вход без маршрутного контента.
- Для активации QR используй один универсальный маршрут: `src/pages/activate/ActivatePointPage.tsx` на путях `/activate/:token` и fallback `/activate?token=...`.
- Не возвращай scanner overlay и camera-based QR flow без отдельной явной задачи.

## Карта, геолокация и маршрут

- Логику карты держи в `src/features/navigation`.
- Геолокацию получай через `src/shared/lib/useCurrentGeolocation.ts`.
- Прогресс маршрута держи в `src/features/game/model/useRouteProgressStore.ts`.
- Источник истины для точек маршрута — backend `places` из `/routes` и `/routes/{route_id}`, смэппленные в `src/features/navigation/api/routesApi.ts`.
- Не возвращай статический конфиг `routePoints.ts` и не заводи второй источник истины для точек маршрута.
- Маршрут по карте должен строиться по данным стора и backend-точкам, а не через вшитые координаты в JSX.
- Первая точка массива `route.routePoints` всегда считается стартом, последняя — финалом маршрута.
- Геолокация пользователя отображается отдельным маркером и не должна менять порядок построения линии маршрута.
- Viewer state маршрута (`is_purchased`, `is_available`, `is_active`, `is_completed`, `scanned_places_count`) бери из самих `GET /routes` и `GET /routes/{route_id}`, если backend отдал эти поля; не восстанавливай их локальными вычислениями.
- В `useRouteProgressStore` разделяй временный `previewRouteId` и реально выбранный `selectedRouteId`; preview не должен становиться выбранным маршрутом сам по себе.
- Если `/routes` или `/routes/{route_id}` не отдали viewer state, допускается fallback на `active_route_id` и `purchased_route_ids` из `/me`, но не на локальные вычисления и не на mock data.
- На `/route` приоритет отображения такой: `previewRouteId` -> `selectedRouteId`/backend active route -> empty state.
- Карта на `/route` должна открываться и для временного preview, и для активного маршрута, но не для гостя.
- Post-payment flow для платного маршрута должен оставаться backend-driven: `payments -> confirm payment -> auto select -> route page`.
- Логику активации точки через QR-ссылку держи в `src/features/scan/api/scanApi.ts` и `src/features/scan/model/useActivatePoint.ts`.
- Не возвращай локальную валидацию QR по `checkpoint.id`: источник истины для активации точки теперь backend.
- Если backend не отдаёт `activation_token` в `places`, не генерируй его на клиенте и не строй из маршрута ссылку активации. Активация должна идти только через внешний QR / universal URL.
- Блок текущей цели на главном экране должен отображаться только для авторизованного пользователя.

## Code и admin flow

- Пользовательский code flow держи в `src/features/code`.
- Каталог призов, draft и пользовательские codes храни в `src/features/code/model/useCodeStore.ts`.
- Админские действия по code держи отдельно в `src/features/code/model/useAdminCodeStore.ts`.
- Админскую сессию храни отдельно в `src/features/admin/model/useAdminStore.ts`.
- Пользовательские коды выдачи должны создаваться через backend API, а не генерироваться локально.
- Админская панель `/admin/codes` должна работать только с backend-данными, а не с локальными mock/code store-данными.

## Фичи и страницы

- `src/pages/home`, `src/pages/catalog`, `src/pages/route`, `src/pages/profile`, `src/pages/redeem`, `src/pages/auth`, `src/pages/admin`, `src/pages/activate` отражают реальные пользовательские сценарии.
- Логику activation-flow держи в `src/features/scan`, но без camera UI и overlay.
- Если меняется пользовательский путь от маршрута до награды или code, проверяй совместимость между `auth`, `route progress`, `code` и `scan`.

## Качество изменений

- После изменений удаляй неиспользуемые компоненты, файлы и ассеты.
- Не оставляй битую кодировку, смешение языков и нечитаемые строки. Все текстовые файлы проекта должны сохраняться в нормальной UTF-8 кодировке.
- Перед завершением задачи прогоняй как минимум `npm run lint` и `npm run build`, если изменения затрагивают приложение.
- Если обновляешь архитектурные правила, структуру store или data flow проекта, синхронизируй `AGENTS.md` и `ARCHITECTURE.md`.
