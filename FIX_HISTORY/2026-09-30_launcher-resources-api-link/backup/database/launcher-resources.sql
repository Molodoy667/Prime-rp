-- Migration: explicit launcher resource-update switch and metadata.
-- Run after site-content.sql on an existing installation.
INSERT INTO `site_settings` (`section`,`setting_key`,`setting_value`,`value_type`) VALUES
('launcher','resources_enabled','0','boolean'),
('launcher','resources_url','','url'),
('launcher','resources_version','1','text')
ON DUPLICATE KEY UPDATE
  `value_type`=VALUES(`value_type`);
