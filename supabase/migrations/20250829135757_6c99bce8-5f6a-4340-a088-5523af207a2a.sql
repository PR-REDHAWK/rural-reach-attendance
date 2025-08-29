-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('teacher', 'admin');

-- Create enum for attendance status
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');

-- Create schools table
CREATE TABLE public.schools (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'teacher',
    school_id UUID REFERENCES public.schools(id),
    assigned_class TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT,
    photo_url TEXT,
    parent_phone TEXT,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(school_id, roll_number)
);

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status attendance_status NOT NULL DEFAULT 'present',
    marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    UNIQUE(student_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for schools
CREATE POLICY "Schools are viewable by authenticated users" 
ON public.schools FOR SELECT 
TO authenticated USING (true);

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create policies for students
CREATE POLICY "Users can view students from their school" 
ON public.students FOR SELECT 
TO authenticated USING (
    school_id IN (
        SELECT school_id FROM public.profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Teachers can insert students" 
ON public.students FOR INSERT 
TO authenticated WITH CHECK (
    school_id IN (
        SELECT school_id FROM public.profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Teachers can update students from their school" 
ON public.students FOR UPDATE 
TO authenticated USING (
    school_id IN (
        SELECT school_id FROM public.profiles WHERE user_id = auth.uid()
    )
);

-- Create policies for attendance
CREATE POLICY "Users can view attendance from their school" 
ON public.attendance FOR SELECT 
TO authenticated USING (
    student_id IN (
        SELECT s.id FROM public.students s
        JOIN public.profiles p ON s.school_id = p.school_id
        WHERE p.user_id = auth.uid()
    )
);

CREATE POLICY "Teachers can insert attendance" 
ON public.attendance FOR INSERT 
TO authenticated WITH CHECK (
    teacher_id = auth.uid() AND
    student_id IN (
        SELECT s.id FROM public.students s
        JOIN public.profiles p ON s.school_id = p.school_id
        WHERE p.user_id = auth.uid()
    )
);

CREATE POLICY "Teachers can update attendance they created" 
ON public.attendance FOR UPDATE 
TO authenticated USING (teacher_id = auth.uid());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON public.schools
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'teacher')
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample school data
INSERT INTO public.schools (name, address) VALUES 
('Bright Future Primary School', 'Village Rampur, Block Tehsil, District Meerut, UP');

-- Create indexes for better performance
CREATE INDEX idx_students_school_class ON public.students(school_id, class);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);