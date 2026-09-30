# FIX: Настройки трейлера и синхронизация рулетки

Дата

2026-09-30

Статус

TESTING

## Проблема

- В админке не было поля для ссылки на трейлер.
- Кнопка трейлера на главной использовала только статичный `siteConfig.trailerUrl`.
- Админский экран рулетки получал список призов и цену отдельными запросами, без единого явного ответа конфигурации.

## Корневая причина

`site-meta` не имел default-настройки `trailer_url`, `App` не передавал настройку трейлера в `Hero`, а `Hero` напрямую читал `siteConfig.trailerUrl`. Для рулетки призы читались из `site_roulette_prizes`, а цена в админке дополнительно читалась через `/api/site-meta`; пользовательский API уже использовал `site_settings`, но админский экран не получал цену из того же endpoint.

## Как работает система

Админка → `POST /api/site-meta` → `site_settings(section='general', setting_key='trailer_url')` → `GET /api/site-meta` → `App` → `Hero` → `Overlay`.

Рулетка → `site_roulette_prizes` для призов и `site_settings(section='roulette', setting_key='spin_price')` для цены → `/api/roulette` возвращает оба значения → пользовательская рулетка и `RouletteAdmin` используют этот API.

## Исследованные файлы

- `api/site-meta.js` — default settings, чтение и сохранение настроек.
- `api/roulette.js` — схема и чтение призов, цена прокрутки, admin GET.
- `src/components/Account/AdminPanel.tsx` — отображение и сохранение настроек сайта.
- `src/components/Account/RouletteAdmin.tsx` — редактирование призов и цены.
- `src/App.tsx` — загрузка публичных настроек и передача в главную.
- `src/components/Hero/index.tsx` — кнопка трейлера.
- `src/components/ui/Overlay.tsx` — отображение видео и embed-трейлера.
- `src/data/api.ts` — преобразование публичных настроек из API.

## Изменённые файлы

- `api/site-meta.js` — добавлен default `trailer_url`.
- `api/roulette.js` — admin GET возвращает `spinPrice` из того же `getRouletteConfig`, который использует пользовательский API.
- `src/components/Account/AdminPanel.tsx` — добавлена подпись «Посилання на трейлер».
- `src/App.tsx` — настройка `trailer_url` передаётся в `Hero`.
- `src/components/Hero/index.tsx` — используется URL из админки; при пустом URL показывается понятное сообщение.
- `src/components/ui/Overlay.tsx` — YouTube/Vimeo ссылки открываются через iframe, прямые видеофайлы — через video.
- `src/components/Account/RouletteAdmin.tsx` — призы и цена читаются единым запросом `/api/roulette`.
- `src/styles/global.css` — задан размер iframe/video трейлера.

## Исследованные, но НЕ изменённые

- `src/data/api.ts` — уже преобразует массив `site-meta.settings` в объект ключ-значение; изменение не потребовалось.
- `src/config/site.ts` — оставлен как fallback для `trailerUrl`.
- `src/components/Roulette/index.tsx` — уже читает призы и цену из `/api/roulette`; изменение не потребовалось.

## Backup

Оригиналы до изменения находятся в `backup/api/...` и `backup/src/...`.

## Fixed

Итоговые версии после изменения находятся в `fixed/api/...` и `fixed/src/...`.

## Риски

- Ссылка на YouTube/Vimeo должна быть публичной или доступной браузеру; приватный ролик не воспроизведётся.
- Для прямого видео нужен URL файла, а не HTML-страницы.
- Реальное подключение к MySQL и визуальная проверка опубликованного сайта в этом запуске не выполнялись.

## Проверка

- `git diff --check` — пройден.
- `node --check api/site-meta.js` — пройден.
- `node --check api/roulette.js` — пройден.
- `npm run build:vercel` — пройден, TypeScript и Vite production build завершились с кодом 0.
- Сверены backup/fixed snapshots изменённых файлов.
- Браузерная проверка админки, фактического сохранения в удалённой БД и воспроизведения конкретной ссылки трейлера не выполнялась.

## Результат

Код собирается; после указания ссылки в админке главная получает её через API, а рулетка и админская вкладка используют общий источник призов и цены. Фактическая работа с удалённой БД ожидает деплоя и проверки.

## Rollback

Восстановить изменённые файлы версиями из соответствующих путей `backup/`, затем повторно выполнить production-сборку.
