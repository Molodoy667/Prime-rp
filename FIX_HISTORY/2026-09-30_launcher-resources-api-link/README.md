# FIX: URL API оновлення ресурсів лаунчера

Дата

2026-09-30

Статус

TESTING

## Проблема

Потрібно зберігати окреме посилання API оновлення ресурсів, не змішуючи його з URL архіву ресурсів.

## Коренева причина

У контракті лаунчера та налаштуваннях сайту не було окремого ключа для API ресурсів.

## Як працює система

Адмінка `AdminPanel.tsx` → `POST /api/site-meta` з `action=setting-upsert` → `site_settings` → `GET /api/launcher` читає `resources_api_url` → повертає `launcher.resourcesApiUrl` і top-level `resourcesApiUrl`.

## Изменённые файлы

- `api/launcher.js` — добавлено чтение и выдача `resourcesApiUrl`.
- `api/site-meta.js` — добавлена настройка для админки.
- `src/components/Account/AdminPanel.tsx` — украинская подпись поля API.
- `database/site-content.sql` — добавлен ключ для новых установок.
- `database/launcher-resources.sql` — добавлен ключ для существующей базы.

## Проверка

- Проверен diff и связанная цепочка API/админки/SQL.
- Синтаксис `api/launcher.js` и `api/site-meta.js` проверен через `node --check`.
- Сборка проекта выполняется после фикса.
- В phpMyAdmin добавлена строка `launcher.resources_api_url` в `site_settings`; значение пока пустое и задаётся администратором.

## Rollback

Восстановить изменённые файлы из `backup/` и удалить ключ `launcher.resources_api_url` из `site_settings` только после проверки зависимостей.
