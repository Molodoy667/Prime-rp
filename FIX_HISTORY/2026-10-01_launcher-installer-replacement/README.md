# FIX: Замена установщика PRIME RP

Дата

2026-10-01

Статус

TESTING

## Проблема

Нужно заменить `public/PRIME RP Setup.exe` версией из указанной пользователем папки Installer.

## Изменённый файл

- `public/PRIME RP Setup.exe` — заменён бинарным файлом из `D:/Legion Gta/geme/LEGION7/LEGION_GTA/bin/Debug/net48/Installer/PRIME RP Setup.exe`.

## Проверка

- Старый файл сохранён в `backup/public/PRIME RP Setup.exe`.
- Новый файл сохранён в `fixed/public/PRIME RP Setup.exe`.
- SHA-256 источника и итогового файла совпадает: `38690F1C07CDDB8884F44832E0673F5E0D50585B8C9BAD919ED41E750028955F`.
- Проверка запуска установщика не выполнялась.

## Rollback

Восстановить `public/PRIME RP Setup.exe` из `backup/public/PRIME RP Setup.exe`.
