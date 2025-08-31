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