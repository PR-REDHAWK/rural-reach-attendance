import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  setupVideoStream, 
  stopVideoStream, 
  getDescriptorFromVideoFrame,
  captureFrameAsBlob 
} from '@/lib/face/engine';

interface FaceCaptureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (faceDescriptor: number[], imageBlob: Blob) => void;
  studentName?: string;
}

export const FaceCaptureDialog: React.FC<FaceCaptureDialogProps> = ({
  isOpen,
  onClose,
  onCapture,
  studentName
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

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
      
      // Start face detection loop
      startFaceDetection();
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera setup error:', err);
    }
  };

  const startFaceDetection = () => {
    const detectFace = async () => {
      if (!videoRef.current || !isStreaming) return;
      
      try {
        const descriptor = await getDescriptorFromVideoFrame(videoRef.current);
        setFaceDetected(!!descriptor);
      } catch (err) {
        console.error('Face detection error:', err);
      }
      
      if (isStreaming) {
        setTimeout(detectFace, 500); // Check every 500ms
      }
    };
    
    detectFace();
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !streamRef.current) return;
    
    try {
      setIsCapturing(true);
      setError(null);
      
      // Get face descriptor
      const descriptor = await getDescriptorFromVideoFrame(videoRef.current);
      if (!descriptor) {
        setError('No face detected. Please position your face clearly in the frame.');
        return;
      }
      
      // Capture the frame as blob
      const imageBlob = await captureFrameAsBlob(videoRef.current);
      
      // Pass both descriptor and image to parent
      onCapture(descriptor, imageBlob);
      handleClose();
    } catch (err) {
      setError('Failed to capture face data. Please try again.');
      console.error('Capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      stopVideoStream(streamRef.current);
      streamRef.current = null;
    }
    setIsStreaming(false);
    setFaceDetected(false);
    setError(null);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Face
            {studentName && <span className="text-muted-foreground">- {studentName}</span>}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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
            
            {/* Face detection overlay */}
            {isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className={`w-48 h-48 border-2 rounded-full transition-colors ${
                    faceDetected 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-orange-500 bg-orange-500/10'
                  }`}
                />
              </div>
            )}
            
            {/* Status indicator */}
            {isStreaming && (
              <div className="absolute top-2 right-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  faceDetected 
                    ? 'bg-green-500 text-white' 
                    : 'bg-orange-500 text-white'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    faceDetected ? 'bg-white' : 'bg-white animate-pulse'
                  }`} />
                  {faceDetected ? 'Face Detected' : 'Position Face'}
                </div>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Position your face in the circle</p>
            <p>• Look directly at the camera</p>
            <p>• Ensure good lighting</p>
            <p>• Remove glasses if possible</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={capturePhoto}
              disabled={!faceDetected || isCapturing}
              className="flex-1"
            >
              {isCapturing ? (
                'Capturing...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Capture
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};