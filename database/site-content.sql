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

INSERT INTO `site_seo_pages` (`path`,`title`,`description`,`keywords`) VALUES
('/', 'PRIME RP — Україна. Твоя історія. Твої правила.', 'PRIME RP — український MTA RolePlay-проєкт. Відкрий свій світ: українські міста, кар’єра, автомобілі та власна історія.', 'PRIME RP, MTA RolePlay, український MTA, GTA RolePlay Україна'),
('/forum', 'Форум PRIME RP — спільнота гравців', 'Офіційний форум PRIME RP: новини, підтримка, обговорення та пропозиції гравців.', 'PRIME RP форум, спільнота, підтримка'),
('/account', 'Особистий кабінет PRIME RP', 'Увійдіть до особистого кабінету PRIME RP, щоб переглянути свій ігровий профіль та статистику.', 'PRIME RP кабінет, профіль гравця'),
('/rules', 'Правила PRIME RP', 'Офіційні правила спільноти та ігрового проєкту PRIME RP.', 'правила PRIME RP'),
('/terms', 'Умови користування — PRIME RP', 'Умови користування сайтом і сервісами PRIME RP.', 'умови PRIME RP'),
('/privacy', 'Політика конфіденційності — PRIME RP', 'Політика конфіденційності офіційного сайту PRIME RP.', 'конфіденційність PRIME RP')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`),`description`=VALUES(`description`),`keywords`=VALUES(`keywords`);

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
