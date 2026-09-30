# FIX: Окремий прапорець оновлення ресурсів лаунчера

Дата: 2026-09-30

Статус: TESTING

## Проблема

У налаштуваннях лаунчера вже були `resources_url` і `resources_version`, але не було окремого керування увімкненням оновлення ресурсів. Прапорець не повинен залежати від `maintenance`.

## Коренева причина

`api/launcher.js` повертав URL і версію ресурсів, але не читав окрему boolean-настройку. Адмінська форма показувала всі настройки одним текстовим input, тому явного перемикача не було.

## Як працює система

Адмінка `AdminPanel.tsx` → `POST /api/site-meta` з `action=setting-upsert` → таблиця `site_settings` → `GET /api/launcher` читає `resources_enabled`, `resources_url`, `resources_version` → повертає їх у `launcher`.

## Досліджені файли

- `api/launcher.js` — контракт API та читання launcher settings.
- `api/site-meta.js` — GET/POST налаштувань і доступ адміністратора.
- `src/components/Account/AdminPanel.tsx` — відображення та збереження полів.
- `database/site-content.sql` — початкова схема та значення `site_settings`.
- `api/_db.js` — спільне MySQL-підключення.

## Змінені файли

- `api/launcher.js` — додано `resourcesEnabled` і розбір boolean-значень.
- `api/site-meta.js` — додано default-опис launcher settings для адмінки.
- `src/components/Account/AdminPanel.tsx` — додано підпис і checkbox для `resources_enabled`; boolean settings зберігаються як `1`/`0`.
- `database/site-content.sql` — додано початковий ключ `launcher.resources_enabled`.
- `database/launcher-resources.sql` — окрема безпечна міграція для існуючої бази.

## Backup / Fixed

Резервні копії змінених файлів збережені в `backup/`, підсумкові версії — у `fixed/`. Backup `api/site-meta.js` знятий з commit `HEAD` перед зміною і збережений як `backup/api-site-meta.js`.

## Що конкретно виправлено

API тепер повертає:

```json
{
  "launcher": {
    "resourcesEnabled": false,
    "resourcesUrl": "",
    "resourcesVersion": "1"
  }
}
```

Поле `maintenance` залишається окремим и не впливає на `resourcesEnabled`. Для сумісності `resourcesEnabled` також повертається у верхньому рівні відповіді API.

## Перевірка

- `node --check api/launcher.js` — успішно.
- `node --check api/site-meta.js` — успішно.
- `npm run build:vercel` — успішно.
- `git diff --check` — без помилок.
- SQL міграцію перевірено текстово; виконання на production MySQL не проводилось, бо доступ до production DB у цьому середовищі не підключений.

## Результат

Код і SQL готові до деплою. Після застосування `database/launcher-resources.sql` адмін зможе окремо ввімкнути оновлення ресурсів, вказати URL і версію.

## Rollback

Відновити змінені файли з `backup/`. Запис `launcher.resources_enabled` можна залишити в БД — він не використовується старим кодом, або видалити окремим SQL після перевірки залежностей.
