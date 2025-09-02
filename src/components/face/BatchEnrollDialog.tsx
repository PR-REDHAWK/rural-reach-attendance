import React, { useState, useRef } from 'react';
import { Users, Camera, Check, X, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FaceCaptureDialog } from './FaceCaptureDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  roll_number: string;
  photo_url?: string;
  face_descriptor?: number[];
  face_enrolled_at?: string;
}

interface BatchEnrollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onEnrollmentComplete: () => void;
}

export const BatchEnrollDialog: React.FC<BatchEnrollDialogProps> = ({
  isOpen,
  onClose,
  students,
  onEnrollmentComplete
}) => {
  const { toast } = useToast();
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [enrolledStudents, setEnrolledStudents] = useState<Set<string>>(new Set());
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCapture, setShowCapture] = useState(false);

  const unenrolledStudents = students.filter(s => !s.face_descriptor || s.face_descriptor.length === 0);
  const currentStudent = unenrolledStudents[currentStudentIndex];
  const progress = (enrolledStudents.size / unenrolledStudents.length) * 100;

  const handleFaceCapture = async (faceDescriptor: number[], imageBlob: Blob) => {
    if (!currentStudent) return;

    try {
      setIsCapturing(true);

      // Upload face image if provided
      let photoUrl = null;
      if (imageBlob) {
        const fileName = `${currentStudent.id}_face_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('student-faces')
          .upload(fileName, imageBlob);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('student-faces')
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      // Update student with face descriptor
      const { error } = await supabase
        .from('students')
        .update({
          face_descriptor: faceDescriptor,
          face_enrolled_at: new Date().toISOString(),
          photo_url: photoUrl || currentStudent.photo_url
        })
        .eq('id', currentStudent.id);

      if (error) throw error;

      setEnrolledStudents(prev => new Set([...prev, currentStudent.id]));
      
      toast({
        title: "Face Enrolled",
        description: `${currentStudent.name} enrolled successfully`,
      });

      // Move to next student or complete
      if (currentStudentIndex < unenrolledStudents.length - 1) {
        setCurrentStudentIndex(prev => prev + 1);
      } else {
        // All students enrolled
        toast({
          title: "Batch Enrollment Complete",
          description: `${enrolledStudents.size + 1} students enrolled successfully`,
        });
        onEnrollmentComplete();
        handleClose();
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        title: "Enrollment Failed",
        description: `Failed to enroll ${currentStudent.name}`,
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
      setShowCapture(false);
    }
  };

  const skipStudent = () => {
    if (currentStudentIndex < unenrolledStudents.length - 1) {
      setCurrentStudentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStudentIndex(0);
    setEnrolledStudents(new Set());
    setShowCapture(false);
    onClose();
  };

  if (!isOpen || unenrolledStudents.length === 0) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Batch Face Enrollment
              <Badge variant="secondary">
                {currentStudentIndex + 1} of {unenrolledStudents.length}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Enroll face data for multiple students at once
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            {currentStudent && (
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <span className="text-lg font-bold">
                        {currentStudent.roll_number}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold">{currentStudent.name}</h3>
                      <p className="text-muted-foreground">
                        Roll Number: {currentStudent.roll_number}
                      </p>
                    </div>

                    <Alert>
                      <Camera className="h-4 w-4" />
                      <AlertDescription>
                        Ready to capture face data for this student. 
                        Make sure they are positioned well in front of the camera.
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowCapture(true)}
                        disabled={isCapturing}
                        className="flex-1"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Capture Face
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={skipStudent}
                        disabled={isCapturing}
                      >
                        Skip
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <p>Students without face data: {unenrolledStudents.length}</p>
              <p>Enrolled in this session: {enrolledStudents.size}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FaceCaptureDialog
        isOpen={showCapture}
        onClose={() => setShowCapture(false)}
        onCapture={handleFaceCapture}
        studentName={currentStudent?.name}
      />
    </>
  );
};