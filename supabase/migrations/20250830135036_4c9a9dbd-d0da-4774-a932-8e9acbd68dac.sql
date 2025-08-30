-- Update any existing teacher profiles to be assigned to Class 5 and the demo school
UPDATE public.profiles 
SET 
    assigned_class = 'Class 5',
    school_id = (SELECT id FROM public.schools WHERE name = 'Bright Future Primary School' LIMIT 1)
WHERE role = 'teacher' AND assigned_class IS NULL;