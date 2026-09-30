const columns = {
  forum_users: {
    role: "ENUM('admin','moderator','user') NOT NULL DEFAULT 'user'",
    tag_label: "VARCHAR(40) NULL",
    tag_color: "VARCHAR(20) NULL",
    bio: "TEXT NULL",
    city: "VARCHAR(80) NULL",
    discord: "VARCHAR(100) NULL",
    phone: "VARCHAR(30) NULL",
  },
  forum_categories: {
    parent_id: "BIGINT UNSIGNED NULL",
    icon: "VARCHAR(40) NOT NULL DEFAULT 'messages'",
    color: "VARCHAR(20) NOT NULL DEFAULT '#d6a84b'",
    sort_order: "INT NOT NULL DEFAULT 0",
  },
  forum_topics: {
    body: "LONGTEXT NOT NULL",
    tags: "JSON NULL",
    replies_count: "INT NOT NULL DEFAULT 0",
    views: "INT NOT NULL DEFAULT 0",
    pinned: "TINYINT(1) NOT NULL DEFAULT 0",
    locked: "TINYINT(1) NOT NULL DEFAULT 0",
    last_author: "BIGINT UNSIGNED NULL",
    last_at: "DATETIME NULL",
    updated_at: "DATETIME NULL",
  },
  forum_replies: {
    likes: "INT NOT NULL DEFAULT 0",
    updated_at: "DATETIME NULL",
  },
};

async function addMissingColumn(db, table, column, definition) {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  if (!rows.length) await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

export async function ensureForumSchema(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS forum_users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(32) NOT NULL,
    email VARCHAR(190) NOT NULL,
    password_hash CHAR(64) NOT NULL,
    role ENUM('admin','moderator','user') NOT NULL DEFAULT 'user',
    tag_label VARCHAR(40) NULL,
    tag_color VARCHAR(20) NULL,
    bio TEXT NULL,
    city VARCHAR(80) NULL,
    discord VARCHAR(100) NULL,
    phone VARCHAR(30) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), UNIQUE KEY forum_users_username (username), UNIQUE KEY forum_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await db.query(`CREATE TABLE IF NOT EXISTS forum_categories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, parent_id BIGINT UNSIGNED NULL,
    title VARCHAR(120) NOT NULL, description VARCHAR(255) NOT NULL,
    icon VARCHAR(40) NOT NULL DEFAULT 'messages', color VARCHAR(20) NOT NULL DEFAULT '#d6a84b',
    sort_order INT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY forum_categories_parent (parent_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await db.query(`CREATE TABLE IF NOT EXISTS forum_topics (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, category_id BIGINT UNSIGNED NULL,
    author_id BIGINT UNSIGNED NOT NULL, title VARCHAR(180) NOT NULL, body LONGTEXT NOT NULL,
    tags JSON NULL, replies_count INT NOT NULL DEFAULT 0, views INT NOT NULL DEFAULT 0,
    pinned TINYINT(1) NOT NULL DEFAULT 0, locked TINYINT(1) NOT NULL DEFAULT 0,
    last_author BIGINT UNSIGNED NULL, last_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NULL,
    PRIMARY KEY (id), KEY forum_topics_category (category_id), KEY forum_topics_author (author_id), KEY forum_topics_last_author (last_author)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await db.query(`CREATE TABLE IF NOT EXISTS forum_replies (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, topic_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NOT NULL, body LONGTEXT NOT NULL, likes INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NULL,
    PRIMARY KEY (id), KEY forum_replies_topic (topic_id), KEY forum_replies_author (author_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  for (const [table, tableColumns] of Object.entries(columns)) {
    for (const [column, definition] of Object.entries(tableColumns)) await addMissingColumn(db, table, column, definition);
  }
  const defaults = [
    ['Новини та оголошення', 'Офіційні повідомлення команди PRIME RP', 'megaphone', '#d6a84b', 10],
    ['Загальний розділ', 'Спілкування гравців про світ PRIME RP', 'messages', '#9da8b3', 20],
    ['Підтримка гравців', 'Запитання, допомога та технічні звернення', 'life-buoy', '#73a8d1', 30],
    ['Баги та пропозиції', 'Повідомлення про помилки й ідеї розвитку', 'bug', '#c58a79', 40],
    ['Державні організації', 'Поліція, СБУ, ЗСУ, ДСНС та медицина', 'shield', '#8bb58d', 50],
    ['Бізнес та економіка', 'Підприємства, нерухомість і ринок', 'briefcase', '#b89a6c', 60],
    ['Ринок гравців', 'Купівля, продаж та обмін майна', 'repeat', '#b49ac4', 70],
    ['Медіа та творчість', 'Скріншоти, відео, історії та фан-контент', 'camera', '#c89b72', 80],
  ];
  for (const [title, description, icon, color, sortOrder] of defaults) {
    await db.query(
      `INSERT INTO forum_categories (title, description, icon, color, sort_order)
       SELECT ?, ?, ?, ?, ? FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE title = ? LIMIT 1)`,
      [title, description, icon, color, sortOrder, title],
    );
  }
}
