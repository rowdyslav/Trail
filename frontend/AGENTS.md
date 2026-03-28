# AGENTS.md

## Общие правила

- Используй `React + TypeScript` и функциональные компоненты.
- Держи код в рамках FSD-структуры: `app`, `pages`, `features`, `entities`, `shared`.
- Не добавляй лишнюю сложность. Новые абстракции, сервисы и инфраструктурные слои добавляй только если задача действительно этого требует.
- Предпочитай небольшие переиспользуемые компоненты, чистые хуки и явные типы вместо крупных файлов с плотной логикой.
- Перед созданием новой сущности проверь, нельзя ли расширить уже существующие модули: `features/auth`, `features/admin`, `features/game`, `features/navigation`, `features/redemption`, `features/rewards`, `features/scan`.

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
  - `src/features/redemption/model/useRedemptionStore.ts`
  - `src/features/redemption/model/useAdminRedemptionStore.ts`
  - `src/features/rewards/model/useRewardStore.ts`
- Новую логику добавляй в соответствующий доменный store или feature-hook, а не создавай заново агрегирующий глобальный store.
- Для витринных и демо-данных используй `src/entities/quest/model/mockData.ts`, если задача не требует реальной интеграции.
- Не дублируй HTTP-слой и не создавай новые fetch-обёртки поверх `src/shared/api/http.ts` без необходимости.
- Доменные типы держи в `src/shared/types/game.ts` и связанных `shared/types` файлах.
- Для аватара пользователя используй `streakKey` и соответствие из `src/shared/lib/avatarByStreakKey.ts`.

## Реальные API сценарии

Сейчас backend используется для:
- пользовательской авторизации;
- получения профиля `/me`;
- получения призов;
- создания и отмены redemption code;
- админской авторизации;
- проверки и подтверждения redemption code;
- активации точки маршрута через universal endpoint `/scan`.

## Маршрутизация

- Маршрутизацию держи через `react-router-dom`.
- Роутер описывай в `src/app/router.tsx`.
- Пользовательские страницы должны жить внутри `AppShell`, административные страницы внутри `AdminLayout`.
- Не вставляй глобальный хидер, футер, нижнюю навигацию или overlay-компоненты прямо в страницы, если они уже подключены в layout.
- Защищённые пользовательские сценарии реализуй через `src/features/auth/ui/RequireAuth.tsx`.
- Для активации QR используй один универсальный маршрут: `src/pages/activate/ActivatePointPage.tsx` на путях `/activate/:token` и fallback `/activate?token=...`.
- Не возвращай scanner overlay и camera-based QR flow без отдельной явной задачи.

## Карта, геолокация и маршрут

- Логику карты держи в `src/features/navigation`.
- Геолокацию получай через `src/shared/lib/useCurrentGeolocation.ts`.
- Точки маршрута и destination ids храни в `src/features/navigation/model`.
- Прогресс маршрута держи в `src/features/game/model/useRouteProgressStore.ts`.
- Маршруты по карте должны строиться через конфиг точек и данные стора, а не через вшитые координаты в JSX.
- Логику активации точки через QR-ссылку держи в `src/features/scan/api/scanApi.ts` и `src/features/scan/model/useActivatePoint.ts`.
- Не возвращай локальную валидацию QR по `checkpoint.id`: источник истины для активации точки теперь backend.

## Redemption и admin flow

- Пользовательский redemption flow держи в `src/features/redemption`.
- Каталог призов, draft и пользовательские redemption requests храни в `src/features/redemption/model/useRedemptionStore.ts`.
- Админские действия по redemption code держи отдельно в `src/features/redemption/model/useAdminRedemptionStore.ts`.
- Админскую сессию храни отдельно в `src/features/admin/model/useAdminStore.ts`.
- Пользовательские коды выдачи должны создаваться через backend API, а не генерироваться локально.
- Админская панель должна работать только с backend-данными, а не с локальными mock/redemption store-данными.

## Фичи и страницы

- `src/pages/home`, `src/pages/catalog`, `src/pages/route`, `src/pages/profile`, `src/pages/redeem`, `src/pages/auth`, `src/pages/admin`, `src/pages/activate` отражают реальные пользовательские сценарии.
- Логику наград и модальные состояния держи в `src/features/rewards`.
- Логику activation-flow держи в `src/features/scan`, но без camera UI и overlay.
- Если меняется пользовательский путь от маршрута до награды или redemption, проверяй совместимость между `auth`, `route progress`, `redemption`, `scan` и `rewards`.

## Качество изменений

- После изменений удаляй неиспользуемые компоненты, файлы и ассеты.
- Не оставляй битую кодировку, смешение языков и нечитаемые строки. Все текстовые файлы проекта должны сохраняться в нормальной UTF-8 кодировке.
- Перед завершением задачи прогоняй как минимум `npm run lint` и `npm run build`, если изменения затрагивают приложение.
- Если обновляешь архитектурные правила, структуру store или data flow проекта, синхронизируй `AGENTS.md` и `ARCHITECTURE.md`.
