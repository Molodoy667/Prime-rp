-- Personal cabinet roles for ugta_players.
-- Apply once to the production database before deploying the updated API.
ALTER TABLE `ugta_players`
  ADD COLUMN `cabinet_role` ENUM('user', 'moderator', 'admin') NOT NULL DEFAULT 'user'
  AFTER `accesslevel`;

UPDATE `ugta_players`
SET `cabinet_role` = 'admin'
WHERE `id` = 14 AND `nickname` = 'Джек Денієлс';
