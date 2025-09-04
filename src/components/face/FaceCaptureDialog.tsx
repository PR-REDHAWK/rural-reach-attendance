import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, AlertCircle, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkCameraSupport, requestCameraPermission } from '@/lib/camera-utils';
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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

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
      console.log('📸 Starting camera in FaceCaptureDialog...');
      setError(null);
      setIsStreaming(false);
      
      // Check camera support first
      const supportCheck = checkCameraSupport();
      if (!supportCheck.supported) {
        const errorMsg = supportCheck.error || 'Camera not supported';
        console.error('❌ Camera support check failed:', errorMsg);
        setError(errorMsg);
        return;
      }
      console.log('✅ Camera support confirmed');

      if (!videoRef.current) {
        const errorMsg = 'Video element not available';
        console.error('❌', errorMsg);
        setError(errorMsg);
        return;
      }
      console.log('✅ Video element available');
      
      // Check permissions
      console.log('🔐 Checking camera permissions...');
      const permissionCheck = await requestCameraPermission();
      if (!permissionCheck.granted) {
        const errorMsg = permissionCheck.error || 'Camera permission denied';
        console.error('❌ Permission check failed:', errorMsg);
        setError(errorMsg);
        return;
      }
      console.log('✅ Camera permissions granted');
      
      // Stop existing stream before starting new one
      if (streamRef.current) {
        console.log('🛑 Stopping existing stream...');
        stopVideoStream(streamRef.current);
        streamRef.current = null;
      }
      
      console.log('📹 Setting up new video stream...');
      const stream = await setupVideoStream(videoRef.current, facingMode);
      streamRef.current = stream;
      setIsStreaming(true);
      console.log('🎊 Camera started successfully');
      
      // Start face detection loop
      startFaceDetection();
    } catch (err) {
      console.error('💥 Camera setup error in FaceCaptureDialog:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unable to access camera. Please check permissions and try again.';
      setError(errorMessage);
      setIsStreaming(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isOpen && videoRef.current && isStreaming) {
      startCamera();
    }
  }, [facingMode]);

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
          <DialogDescription>
            Position your face in the frame and capture for enrollment
          </DialogDescription>
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
              controls={false}
              style={{ minHeight: '240px' }}
            />
            
            {/* Debug overlay showing video state */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute top-4 left-4 bg-black/75 text-white text-xs p-2 rounded">
                Video: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}<br/>
                Ready: {videoRef.current?.readyState || 0}<br/>
                Stream: {isStreaming ? 'Yes' : 'No'}
              </div>
            )}
            
            {/* Camera flip button */}
            <div className="absolute top-2 left-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={toggleCamera}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Face detection overlay */}
            {isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className={`w-48 h-48 border-4 rounded-full transition-all duration-300 ${
                    faceDetected 
                      ? 'border-green-500 bg-green-500/10 scale-105' 
                      : 'border-orange-500 bg-orange-500/10 animate-pulse'
                  }`}
                >
                  {/* Face detection guide corners */}
                  <div className="relative w-full h-full">
                    <div className={`absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 ${
                      faceDetected ? 'border-green-400' : 'border-orange-400'
                    }`} />
                    <div className={`absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 ${
                      faceDetected ? 'border-green-400' : 'border-orange-400'
                    }`} />
                    <div className={`absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 ${
                      faceDetected ? 'border-green-400' : 'border-orange-400'
                    }`} />
                    <div className={`absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 ${
                      faceDetected ? 'border-green-400' : 'border-orange-400'
                    }`} />
                  </div>
                </div>
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