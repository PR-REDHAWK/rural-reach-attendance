-- Fix the search path security issue for the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'teacher')
    );
    RETURN NEW;
END;
$$;