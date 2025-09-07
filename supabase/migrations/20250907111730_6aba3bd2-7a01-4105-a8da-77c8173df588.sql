-- Update existing profiles to admin role for the most recent signups
UPDATE profiles 
SET role = 'admin' 
WHERE user_id IN (
  SELECT user_id 
  FROM profiles 
  WHERE created_at >= NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC 
  LIMIT 2
);

-- Fix the trigger function to properly handle admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
        CASE 
            WHEN NEW.raw_user_meta_data ->> 'role' = 'admin' THEN 'admin'::public.user_role
            ELSE 'teacher'::public.user_role
        END
    );
    RETURN NEW;
END;
$function$;