CREATE TABLE IF NOT EXISTS forum_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id INT UNSIGNED NULL,
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(128) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','moderator','user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS forum_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  icon VARCHAR(32) NOT NULL DEFAULT 'messages',
  color VARCHAR(16) NOT NULL DEFAULT '#d6a84b',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS forum_topics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  author_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  replies_count INT UNSIGNED NOT NULL DEFAULT 0,
  views INT UNSIGNED NOT NULL DEFAULT 0,
  pinned TINYINT(1) NOT NULL DEFAULT 0,
  locked TINYINT(1) NOT NULL DEFAULT 0,
  tags JSON NULL,
  last_author INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX(category_id), INDEX(author_id), INDEX(last_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS forum_replies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id BIGINT UNSIGNED NOT NULL,
  author_id INT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  likes INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX(topic_id), INDEX(author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO forum_users (username,email,password_hash,role) VALUES ('PRIME_Admin','admin@prime-rp.store','CHANGE_ME','admin');
INSERT INTO forum_categories (title,description,icon,color,sort_order) VALUES
('Новини та оголошення','Офіційні повідомлення команди PRIME RP','megaphone','#d6a84b',1),
('Загальний розділ','Спілкування гравців про світ PRIME RP','messages','#9da8b3',2),
('Підтримка гравців','Запитання, допомога та технічні звернення','life-buoy','#73a8d1',3),
('Баги та пропозиції','Повідомлення про помилки й ідеї розвитку','bug','#c58a79',4),
('Державні організації','Поліція, СБУ, ЗСУ, ДСНС та медицина','shield','#8bb58d',5),
('Бізнес та економіка','Підприємства, нерухомість і ринок','briefcase','#b89a6c',6),
('Ринок гравців','Купівля, продаж та обмін майна','repeat','#b49ac4',7),
('Медіа та творчість','Скріншоти, відео, історії та фан-контент','camera','#c89b72',8);
