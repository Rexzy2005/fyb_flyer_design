-- Seed templates into the database
-- Note: Template IDs need to be simple strings for mock templates
INSERT INTO "templates" (id, name, category, status, "preview_image", "usage_count", fields, "canvas_config", "created_at", "updated_at")
VALUES 
('1', 'FYB Face of the Day - Classic', 'FYB', 'public', '/api/placeholder/800/600', 245, '[]', '{"width":800,"height":600,"backgroundColor":"#ffffff"}', NOW(), NOW()),
('2', 'FYB Face of the Week - Modern', 'FYB', 'public', '/api/placeholder/800/600', 189, '[]', '{"width":800,"height":600,"backgroundColor":"#f5f5f5"}', NOW(), NOW()),
('3', 'Department Recognition - Elegant', 'FYB', 'public', '/api/placeholder/800/600', 142, '[]', '{"width":800,"height":600,"backgroundColor":"#2c3e50"}', NOW(), NOW()),
('4', 'Student of the Month - Vibrant', 'FYB', 'public', '/api/placeholder/800/600', 98, '[]', '{"width":800,"height":600,"backgroundColor":"#3498db"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
