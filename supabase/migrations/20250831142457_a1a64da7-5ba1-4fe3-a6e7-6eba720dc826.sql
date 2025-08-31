-- Add face recognition columns to students table
ALTER TABLE public.students 
ADD COLUMN face_descriptor JSONB,
ADD COLUMN face_enrolled_at TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for student face photos
INSERT INTO storage.buckets (id, name, public) VALUES ('student-faces', 'student-faces', true);

-- Create policies for student-faces bucket
CREATE POLICY "Teachers can view student face photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'student-faces' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'teacher'
));

CREATE POLICY "Teachers can upload student face photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'student-faces' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'teacher'
));

CREATE POLICY "Teachers can update student face photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'student-faces' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'teacher'
));

-- Update students RLS policy to include face_descriptor access
CREATE POLICY "Teachers can update student face data"
ON public.students
FOR UPDATE
USING (school_id IN (
  SELECT profiles.school_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

-- Add trigger to update students updated_at
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();