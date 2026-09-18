-- Personal cabinet roles are stored in site_settings so they survive ugta_players refreshes.
INSERT INTO `site_settings` (`section`,`setting_key`,`setting_value`,`value_type`) VALUES
('access','admin_player_ids','14','json'),
('access','moderator_player_ids','','json')
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`),`value_type`=VALUES(`value_type`);
