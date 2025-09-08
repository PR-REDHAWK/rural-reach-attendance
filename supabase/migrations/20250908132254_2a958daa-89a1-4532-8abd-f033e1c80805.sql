-- Update the most recent profile to admin role
UPDATE profiles 
SET role = 'admin'::user_role 
WHERE user_id = 'd43f12bb-68de-4b46-b153-dec102ab8b7a';

-- Also update the other recent profile
UPDATE profiles 
SET role = 'admin'::user_role 
WHERE user_id = '3e5b2f5e-03b8-4478-94c2-c1eb92d2e2d1';