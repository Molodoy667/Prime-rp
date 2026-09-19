-- Site-owned content tables. These are intentionally prefixed with site_.
CREATE TABLE IF NOT EXISTS `site_news` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(160) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `category` VARCHAR(80) NOT NULL DEFAULT 'НОВИНИ',
  `body` TEXT NOT NULL,
  `image_url` VARCHAR(500) NULL,
  `image_data` LONGTEXT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `is_placeholder` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_news_slug` (`slug`),
  KEY `site_news_public` (`is_published`, `sort_order`, `updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `site_seo_pages` (
  `path` VARCHAR(180) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` VARCHAR(320) NOT NULL DEFAULT '',
  `keywords` VARCHAR(500) NULL,
  `og_image` VARCHAR(500) NULL,
  `canonical_url` VARCHAR(500) NULL,
  `robots` VARCHAR(120) NOT NULL DEFAULT 'index,follow',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `section` VARCHAR(60) NOT NULL,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` LONGTEXT NULL,
  `value_type` ENUM('text','url','boolean','number','json') NOT NULL DEFAULT 'text',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`section`, `setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `site_news` (`slug`,`title`,`category`,`body`,`image_url`,`is_placeholder`,`sort_order`) VALUES
('opening','ВЕЛИКЕ ВІДКРИТТЯ PRIME RP','АНОНС','Тут з’явиться офіційний анонс відкриття PRIME RP: дата запуску, доступні сервери та інструкція для перших гравців. Дату відкриття ще не вказано. Це приклад публікації, а не оголошення про запуск.','/assets/hero-1600.webp',1,1),
('world','ЗНАЙОМСТВО ЗІ СВІТОМ PRIME','СВІТ PRIME','Майбутня рубрика про міста, атмосферу та можливості PRIME RP. Після публікації офіційних матеріалів тут можна буде дізнатися про ігровий світ. Наразі це приклад статті; ілюстрації є концепт-артами.','/assets/city-1600.webp',1,2),
('development','РОЗРОБКА ПРОЄКТУ','ЩОДЕННИК','Ця рубрика призначена для новин команди розробки. Офіційні записи з’являться після підключення редакції. Поточний матеріал демонструє оформлення і не підтверджує конкретних оновлень.','/assets/vehicle-1600.webp',1,3);

INSERT INTO `site_seo_pages` (`path`,`title`,`description`,`keywords`,`og_image`,`canonical_url`,`robots`) VALUES
('/', 'PRIME RP — Ера твого рольового життя в Україні', 'PRIME RP — український MTA RolePlay-проєкт, де кожен гравець створює власну історію. Обирай професію, розвивай персонажа, відкривай міста та живи своєю епохою PRIME.', 'PRIME RP, Era Prime, Ера PRIME, MTA RolePlay Україна, GTA RP Україна, український сервер MTA, рольова гра, онлайн гра, ігровий сервер', 'https://prime-rp.store/assets/hero-1600.webp', 'https://prime-rp.store/', 'index,follow'),
('/forum', 'Форум PRIME RP — спільнота, новини та підтримка гравців', 'Офіційний форум PRIME RP: обговорюй новини проєкту, став запитання, знаходь однодумців і отримуй допомогу від спільноти Era Prime.', 'форум PRIME RP, Era Prime форум, спільнота MTA, новини PRIME RP, підтримка гравців, обговорення GTA RP, українська RolePlay спільнота', 'https://prime-rp.store/assets/city-1600.webp', 'https://prime-rp.store/forum', 'index,follow'),
('/account', 'Особистий кабінет PRIME RP — профіль та прогрес гравця', 'Увійди до особистого кабінету PRIME RP, щоб переглянути свій профіль, рівень, статистику, ігрові ресурси та доступні можливості Era Prime.', 'особистий кабінет PRIME RP, профіль гравця, статистика MTA, прогрес персонажа, Era Prime акаунт, ігровий профіль', 'https://prime-rp.store/assets/official-brand-original.webp', 'https://prime-rp.store/account', 'noindex,nofollow'),
('/rules', 'Правила PRIME RP — чесна гра та рольова атмосфера', 'Ознайомся з офіційними правилами PRIME RP: повага до гравців, чесна гра, рольова поведінка та безпечна участь у світі Era Prime.', 'правила PRIME RP, правила MTA RolePlay, правила GTA RP, чесна гра, рольова гра Україна, правила сервера', 'https://prime-rp.store/assets/vehicle-1600.webp', 'https://prime-rp.store/rules', 'index,follow'),
('/terms', 'Умови користування PRIME RP — правила сайту та сервісів', 'Офіційні умови користування сайтом PRIME RP, особистим кабінетом, форумом, лаунчером та іншими сервісами ігрового проєкту Era Prime.', 'умови користування PRIME RP, правила сайту, умови Era Prime, MTA RolePlay сервіс, користування ігровим сайтом', 'https://prime-rp.store/assets/hero-1600.webp', 'https://prime-rp.store/terms', 'index,follow'),
('/privacy', 'Політика конфіденційності PRIME RP — захист даних', 'Дізнайся, як PRIME RP обробляє технічні дані, захищає приватність відвідувачів і забезпечує безпечну роботу сервісів Era Prime.', 'політика конфіденційності PRIME RP, захист персональних даних, приватність MTA, безпека акаунта, Era Prime privacy', 'https://prime-rp.store/assets/city-1600.webp', 'https://prime-rp.store/privacy', 'index,follow'),
('/wiki', 'Вікі PRIME RP — скіни та моделі машин', 'Каталог скінів і моделей машин PRIME RP з ID, назвами та зображеннями для гравців.', 'PRIME RP, вікі, скіни GTA, моделі машин GTA, MTA RolePlay, Era Prime', 'https://prime-rp.store/assets/locations/kyiv.webp', 'https://prime-rp.store/wiki', 'index,follow'),
('/donate', 'Донат-магазин PRIME RP — можливості для гравців', 'Офіційний донат-магазин PRIME RP: PRIME-бонуси, підписки та додаткові можливості для підтримки проєкту.', 'донат PRIME RP, магазин PRIME RP, підписка MTA, Era Prime бонуси', 'https://prime-rp.store/assets/official-brand-original.webp', 'https://prime-rp.store/donate', 'index,follow')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`),`description`=VALUES(`description`),`keywords`=VALUES(`keywords`),`og_image`=VALUES(`og_image`),`canonical_url`=VALUES(`canonical_url`),`robots`=VALUES(`robots`);

INSERT IGNORE INTO `site_settings` (`section`,`setting_key`,`setting_value`,`value_type`) VALUES
('general','site_name','PRIME RP','text'),
('general','site_tagline','Україна. Твоя історія. Твої правила.','text'),
('general','contact_discord','#','url'),
('general','contact_telegram','#','url'),
('news','news_section_title','ОСТАННІ НОВИНИ','text'),
('news','news_enabled','1','boolean'),
('launcher','download_url','','url'),
('launcher','resources_url','','url'),
('launcher','version','1.0.0','text'),
('launcher','resources_version','1','text'),
('launcher','maintenance','0','boolean');

INSERT INTO `site_settings` (`section`,`setting_key`,`setting_value`,`value_type`) VALUES
('access','admin_player_ids','14','json'),
('access','moderator_player_ids','','json')
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`),`value_type`=VALUES(`value_type`);
