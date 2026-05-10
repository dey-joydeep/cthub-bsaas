SET client_encoding = 'UTF8';
TRUNCATE TABLE otp, user_coupon, reservation, coupon, service, user_role, "user", role, tenant, portfolio, social_account RESTART IDENTITY CASCADE;

-- Sample SQL data for all tables

-- Insert tenants (salons)
INSERT INTO tenant (id, name, email, phone, address, created_at, updated_at, primary_color, secondary_color, accent_color) VALUES
  ('tenant-1-uuid', 'Glamour Salon', 'glamour@salon.com', '123-456-7890', '123 Main St', NOW(), NOW(), '#E91E63', '#FFF8F0', '#FFC107'),
  ('tenant-2-uuid', 'Beauty Bliss', 'bliss@salon.com', '987-654-3210', '456 Park Ave', NOW(), NOW(), '#3F51B5', '#F0F4FF', '#FF9800');

-- Insert roles
INSERT INTO role (id, name) VALUES
  (1, 'admin'),
  (2, 'staff'),
  (3, 'member');

-- Insert users
INSERT INTO "user" (id, tenant_id, email, password, name, phone, is_verified, created_at, updated_at, last_login_at) VALUES
  ('user-1-uuid', 'tenant-1-uuid', 'owner@glamour.com', '$2b$10$hash1', 'Alice Owner', '111-222-3333', true, NOW(), NOW(), NOW() - INTERVAL '2 days'),
  ('user-2-uuid', 'tenant-1-uuid', 'staff@glamour.com', '$2b$10$hash2', 'Bob Staff', '222-333-4444', true, NOW(), NOW(), NOW() - INTERVAL '1 day'),
  ('user-3-uuid', 'tenant-2-uuid', 'owner@bliss.com', '$2b$10$hash3', 'Carol Owner', '333-444-5555', true, NOW(), NOW(), NOW());

-- UserRole assignments
INSERT INTO user_role (id, "user_id", role_id) VALUES
  (1, 'user-1-uuid', 1), -- Alice is admin
  (2, 'user-2-uuid', 2), -- Bob is staff
  (3, 'user-3-uuid', 1); -- Carol is admin

-- Insert services
INSERT INTO service (id, tenant_id, name, description, price, duration) VALUES
  ('service-1-uuid', 'tenant-1-uuid', 'Haircut', 'Professional haircut', 30.0, 45),
  ('service-2-uuid', 'tenant-1-uuid', 'Facial', 'Relaxing facial treatment', 50.0, 60),
  ('service-3-uuid', 'tenant-2-uuid', 'Manicure', 'Classic manicure', 20.0, 30);

-- Insert coupons
INSERT INTO coupon (id, tenant_id, code, description, discount, valid_from, valid_to, created_at, updated_at) VALUES
  ('coupon-1-uuid', 'tenant-1-uuid', 'GLAM10', '10% off', 10.0, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()),
  ('coupon-2-uuid', 'tenant-2-uuid', 'BLISS5', '5% off', 5.0, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW());

-- Insert reservations (one guest, one member)
INSERT INTO reservation (id, tenant_id, "user_id", service_id, guest_name, guest_email, guest_phone, reserved_at, status, created_at, updated_at) VALUES
  ('res-1-uuid', 'tenant-1-uuid', NULL, 'service-1-uuid', 'Dana Guest', 'dana@example.com', '555-555-5555', NOW() + INTERVAL '1 day', 'pending', NOW(), NOW()),
  ('res-2-uuid', 'tenant-1-uuid', 'user-2-uuid', 'service-2-uuid', NULL, NULL, NULL, NOW() + INTERVAL '2 days', 'confirmed', NOW(), NOW());

-- Insert user-coupons
INSERT INTO user_coupon (id, "user_id", coupon_id, used_at) VALUES
  (1, 'user-1-uuid', 'coupon-1-uuid', NULL),
  (2, 'user-3-uuid', 'coupon-2-uuid', NOW());

-- Insert OTPs
INSERT INTO otp (id, "user_id", code, expires_at, used, created_at) VALUES
  (1, 'user-1-uuid', '123456', NOW() + INTERVAL '10 min', false, NOW()),
  (2, 'user-3-uuid', '654321', NOW() + INTERVAL '10 min', true, NOW());

-- Insert portfolio items
INSERT INTO portfolio (id, tenant_id, user_id, image_url, description, created_at, updated_at) VALUES
  ('portfolio-1-uuid', 'tenant-1-uuid', 'user-2-uuid', 'https://example.com/haircut1.jpg', 'Classic bob cut for summer.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('portfolio-2-uuid', 'tenant-1-uuid', 'user-2-uuid', 'https://example.com/facial1.jpg', 'Revitalizing facial for glowing skin.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('portfolio-3-uuid', 'tenant-2-uuid', 'user-3-uuid', 'https://example.com/manicure1.jpg', 'Elegant French manicure.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Insert social accounts (simulate Google/Facebook logins)
INSERT INTO social_account (id, provider, provider_user_id, user_id, created_at) VALUES
  (1, 'google', 'google-uid-1', 'user-1-uuid', NOW() - INTERVAL '2 days'),
  (2, 'facebook', 'fb-uid-2', 'user-3-uuid', NOW());