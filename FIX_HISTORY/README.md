# PRIME RP — FIX HISTORY

## 2026-09-30 — wiki-navigation-start-order

Путь: `FIX_HISTORY/2026-09-30_wiki-navigation-start-order/`

Статус: `TESTING`

Кратко: удалён пункт «Магазин» из навигации, исправлены переходы с вложенных страниц на главную с якорями, изменён порядок шагов блока «Як почати», а водяной знак на Wiki-скинах закрыт единым визуальным кадрированием карточки.

Изменённые файлы:

- `src/components/Header/index.tsx`
- `src/components/ui/index.tsx`
- `src/components/HowToStart/index.tsx`
- `src/components/Footer/index.tsx`
- `src/styles/global.css`

## 2026-09-30 — trailer-and-roulette-sync

Путь: `FIX_HISTORY/2026-09-30_trailer-and-roulette-sync/`

Статус: `TESTING`

Кратко: добавлена ссылка на трейлер в настройках сайта, подключён её вывод на главной, а админская рулетка синхронизирована с теми же источниками призов и цены, которые использует пользовательская рулетка.

Изменено:

- `api/site-meta.js`
- `api/roulette.js`
- `src/App.tsx`
- `src/components/Account/AdminPanel.tsx`
- `src/components/Account/RouletteAdmin.tsx`
- `src/components/Hero/index.tsx`
- `src/components/ui/Overlay.tsx`
- `src/styles/global.css`

## 2026-09-30 — forum-database-moderation

Путь: `FIX_HISTORY/2026-09-30_forum-database-moderation/`

Статус: `TESTING`

Кратко: форум переведён с demo/localStorage состояния на MySQL API; добавлены серверное сохранение контента, теги пользователей с цветом и админское перенесення тем между разделами.

Изменено:

- `api/forum-schema.js`
- `api/forum.js`
- `api/forum-auth.js`
- `src/data/forum.ts`
- `src/components/Forum/index.tsx`
- `src/styles/global.css`

## 2026-09-30 — launcher-resources-toggle

Путь: `FIX_HISTORY/2026-09-30_launcher-resources-toggle/`

Статус: `TESTING`

Кратко: добавлено окреме керування оновленням ресурсів лаунчера через `resources_enabled`, а API `/api/launcher` тепер повертає `launcher.resourcesEnabled`, `launcher.resourcesUrl` і `launcher.resourcesVersion`.

Изменено:

- `api/launcher.js`
- `api/site-meta.js`
- `src/components/Account/AdminPanel.tsx`
- `database/site-content.sql`
- `database/launcher-resources.sql`


## 2026-09-30 — launcher-resources-api-link

Путь: `FIX_HISTORY/2026-09-30_launcher-resources-api-link/`
Статус: TESTING

Кратко: добавлена отдельная настройка `launcher.resources_api_url`, выдаваемая API как `launcher.resourcesApiUrl` и top-level `resourcesApiUrl`.


## 2026-10-01 — mta-status-redirect-policy

Путь: `FIX_HISTORY/2026-10-01_mta-status-redirect-policy/`

Статус: TESTING

Кратко: исправлена явная политика HTTP-редиректов в проверке мастер-листа MTA; доступность игрового порта остаётся отдельной проблемой хостинга.

## 2026-10-01 — launcher-installer-replacement

Путь: `FIX_HISTORY/2026-10-01_launcher-installer-replacement/`

Статус: TESTING

Кратко: `public/PRIME RP Setup.exe` заменён указанной пользователем версией; SHA-256 совпадает с исходным файлом.

