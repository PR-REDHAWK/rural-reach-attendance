import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FaceCaptureDialog } from '@/components/face/FaceCaptureDialog';

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: () => void;
}

export const AddStudentDialog: React.FC<AddStudentDialogProps> = ({
  isOpen,
  onClose,
  onStudentAdded
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    parent_phone: '',
    section: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<{
    descriptor: number[];
    imageBlob: Blob;
  } | null>(null);
  const [faceCaptureOpen, setFaceCaptureOpen] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleFaceCapture = (descriptor: number[], imageBlob: Blob) => {
    setFaceData({ descriptor, imageBlob });
    toast({
      title: "Face Captured",
      description: "Face data captured successfully. You can now save the student.",
    });
  };

  const uploadFaceImage = async (studentId: string): Promise<string | null> => {
    if (!faceData) return null;

    try {
      const fileName = `${studentId}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('student-faces')
        .upload(fileName, faceData.imageBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-faces')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading face image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Student name is required');
      }
      if (!formData.roll_number.trim()) {
        throw new Error('Roll number is required');
      }
      if (!profile?.school_id) {
        throw new Error('School not assigned to your profile');
      }

      // Check for duplicate roll number
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('roll_number', formData.roll_number.trim())
        .eq('class', profile.assigned_class || '')
        .eq('school_id', profile.school_id);

      if (existing && existing.length > 0) {
        throw new Error('A student with this roll number already exists in this class');
      }

      // Insert student
      const studentData = {
        name: formData.name.trim(),
        roll_number: formData.roll_number.trim(),
        class: profile.assigned_class || '',
        section: formData.section.trim() || null,
        parent_phone: formData.parent_phone.trim() || null,
        school_id: profile.school_id,
        face_descriptor: faceData ? faceData.descriptor : null,
        face_enrolled_at: faceData ? new Date().toISOString() : null
      };

      const { data: student, error } = await supabase
        .from('students')
        .insert([studentData])
        .select()
        .single();

      if (error) throw error;

      // Upload face image if captured
      if (faceData && student) {
        const photoUrl = await uploadFaceImage(student.id);
        if (photoUrl) {
          // Update student with photo URL
          await supabase
            .from('students')
            .update({ photo_url: photoUrl })
            .eq('id', student.id);
        }
      }

      toast({
        title: "Student Added",
        description: `${formData.name} has been added to the class successfully.`,
      });

      // Reset form and close
      setFormData({
        name: '',
        roll_number: '',
        parent_phone: '',
        section: ''
      });
      setFaceData(null);
      onStudentAdded();
      onClose();

    } catch (err: any) {
      setError(err.message || 'Failed to add student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        roll_number: '',
        parent_phone: '',
        section: ''
      });
      setFaceData(null);
      setError(null);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Add New Student
            </DialogTitle>
            <DialogDescription>
              Add a new student to your class with optional face recognition enrollment
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Student Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roll_number">Roll Number *</Label>
                <Input
                  id="roll_number"
                  value={formData.roll_number}
                  onChange={(e) => handleInputChange('roll_number', e.target.value)}
                  placeholder="e.g. 001"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  placeholder="e.g. A"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parent_phone">Parent Phone</Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                  placeholder="Parent contact"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Face Recognition (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setFaceCaptureOpen(true)}
                disabled={isSubmitting}
              >
                <Camera className="h-4 w-4 mr-2" />
                {faceData ? 'Face Captured ✓' : 'Capture Face'}
              </Button>
              {faceData && (
                <p className="text-xs text-muted-foreground">
                  Face data captured. This will enable automatic attendance marking.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Adding...' : 'Add Student'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <FaceCaptureDialog
        isOpen={faceCaptureOpen}
        onClose={() => setFaceCaptureOpen(false)}
        onCapture={handleFaceCapture}
        studentName={formData.name || 'New Student'}
      />
    </>
  );
};