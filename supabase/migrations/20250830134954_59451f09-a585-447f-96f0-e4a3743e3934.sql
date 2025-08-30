-- Insert sample students for the demo school
INSERT INTO public.students (name, roll_number, class, section, school_id) 
SELECT 
  student_name,
  roll_number,
  'Class 5',
  'A',
  (SELECT id FROM public.schools WHERE name = 'Bright Future Primary School' LIMIT 1)
FROM (
  VALUES 
    ('राहुल शर्मा / Rahul Sharma', '001'),
    ('प्रिया पटेल / Priya Patel', '002'),
    ('अमित कुमार / Amit Kumar', '003'),
    ('सुनीता देवी / Sunita Devi', '004'),
    ('विकास यादव / Vikas Yadav', '005'),
    ('अंजली सिंह / Anjali Singh', '006'),
    ('सुरेश गुप्ता / Suresh Gupta', '007'),
    ('कविता शुक्ला / Kavita Shukla', '008'),
    ('रोहित वर्मा / Rohit Verma', '009'),
    ('मीरा जैन / Meera Jain', '010')
) AS student_data(student_name, roll_number);