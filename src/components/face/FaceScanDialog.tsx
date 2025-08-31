import React, { useState, useRef, useEffect } from 'react';
import { Scan, X, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  setupVideoStream, 
  stopVideoStream, 
  getDescriptorFromVideoFrame,
  findBestMatch 
} from '@/lib/face/engine';

interface Student {
  id: string;
  name: string;
  roll_number: string;
  face_descriptor?: number[];
}

interface FaceScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onMarkAttendance: (studentId: string, status: 'present' | 'absent' | 'late') => void;
  attendanceMarked: Set<string>;
}

export const FaceScanDialog: React.FC<FaceScanDialogProps> = ({
  isOpen,
  onClose,
  students,
  onMarkAttendance,
  attendanceMarked
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMatch, setLastMatch] = useState<{ studentName: string; confidence: number } | null>(null);
  const [scanCount, setScanCount] = useState(0);
  
  const { toast } = useToast();

  const enrolledStudents = students.filter(s => s.face_descriptor && s.face_descriptor.length > 0);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      startCamera();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      if (!videoRef.current) return;
      
      const stream = await setupVideoStream(videoRef.current);
      streamRef.current = stream;
      setIsStreaming(true);
      
      // Start scanning automatically
      startScanning();
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera setup error:', err);
    }
  };

  const startScanning = () => {
    if (scanIntervalRef.current) return;
    
    setIsScanning(true);
    setScanCount(0);
    
    scanIntervalRef.current = setInterval(async () => {
      await performScan();
      setScanCount(prev => prev + 1);
    }, 1000); // Scan every second
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  const performScan = async () => {
    if (!videoRef.current || !isStreaming) return;
    
    try {
      const descriptor = await getDescriptorFromVideoFrame(videoRef.current);
      if (!descriptor) return;
      
      const enrolledFaces = enrolledStudents.map(s => ({
        studentId: s.id,
        descriptor: s.face_descriptor!
      }));
      
      const match = findBestMatch(descriptor, enrolledFaces);
      
      if (match && match.confidence > 0.4) { // 40% confidence threshold
        const student = students.find(s => s.id === match.studentId);
        if (student) {
          setLastMatch({
            studentName: student.name,
            confidence: match.confidence
          });
          
          // Auto-mark attendance if confidence is high and not already marked
          if (match.confidence > 0.6 && !attendanceMarked.has(student.id)) {
            onMarkAttendance(student.id, 'present');
            toast({
              title: "Attendance Marked",
              description: `${student.name} marked as present (${Math.round(match.confidence * 100)}% confidence)`,
            });
            
            // Brief pause after successful match
            stopScanning();
            setTimeout(() => {
              if (isStreaming) startScanning();
            }, 2000);
          }
        }
      } else {
        setLastMatch(null);
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
  };

  const cleanup = () => {
    stopScanning();
    if (streamRef.current) {
      stopVideoStream(streamRef.current);
      streamRef.current = null;
    }
    setIsStreaming(false);
    setLastMatch(null);
    setError(null);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const toggleScanning = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Face Scan Attendance
            <Badge variant="secondary">{enrolledStudents.length} enrolled</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {enrolledStudents.length === 0 && (
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                No students have enrolled faces yet. Add face data to students first.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {/* Scanning overlay */}
            {isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-48 h-48 border-2 rounded-full transition-all duration-500 ${
                  isScanning 
                    ? 'border-blue-500 bg-blue-500/10 animate-pulse' 
                    : 'border-gray-500 bg-gray-500/10'
                }`} />
              </div>
            )}
            
            {/* Match result */}
            {lastMatch && (
              <div className="absolute top-2 left-2 right-2">
                <div className="bg-green-500 text-white p-2 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{lastMatch.studentName}</div>
                    <div className="text-xs opacity-90">
                      {Math.round(lastMatch.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scanning status */}
            {isStreaming && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className={`p-2 rounded-lg text-center text-sm ${
                  isScanning 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-500 text-white'
                }`}>
                  {isScanning ? `Scanning... (${scanCount})` : 'Scanning paused'}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={toggleScanning}
              disabled={!isStreaming || enrolledStudents.length === 0}
              className="flex-1"
              variant={isScanning ? "secondary" : "default"}
            >
              <Scan className="h-4 w-4 mr-2" />
              {isScanning ? 'Pause Scanning' : 'Start Scanning'}
            </Button>
            
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>• Position students one at a time in the scanning area</p>
            <p>• Wait for automatic detection and marking</p>
            <p>• {attendanceMarked.size} of {students.length} students marked today</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};