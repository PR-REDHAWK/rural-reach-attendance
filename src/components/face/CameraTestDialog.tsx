import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { setupVideoStream, stopVideoStream, loadModels } from '@/lib/face/engine';
import { checkCameraSupport, requestCameraPermission, getCameraDevices } from '@/lib/camera-utils';

interface CameraTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export const CameraTestDialog: React.FC<CameraTestDialogProps> = ({
  isOpen,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Browser Support', status: 'pending' },
    { name: 'Camera Permission', status: 'pending' },
    { name: 'Camera Devices', status: 'pending' },
    { name: 'Video Stream', status: 'pending' },
    { name: 'Face Models', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);

  const updateTest = (name: string, status: TestResult['status'], message?: string) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, message } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    try {
      // Test 1: Browser Support
      console.log('🔍 Testing browser support...');
      const supportCheck = checkCameraSupport();
      if (supportCheck.supported) {
        updateTest('Browser Support', 'success', 'Camera API supported');
      } else {
        updateTest('Browser Support', 'error', supportCheck.error);
        return;
      }

      // Test 2: Camera Permission
      console.log('🔐 Testing camera permission...');
      const permissionCheck = await requestCameraPermission();
      if (permissionCheck.granted) {
        updateTest('Camera Permission', 'success', 'Permission granted');
      } else {
        updateTest('Camera Permission', 'error', permissionCheck.error);
        return;
      }

      // Test 3: Camera Devices
      console.log('📷 Enumerating camera devices...');
      const devices = await getCameraDevices();
      setCameras(devices);
      if (devices.length > 0) {
        updateTest('Camera Devices', 'success', `Found ${devices.length} camera(s)`);
      } else {
        updateTest('Camera Devices', 'error', 'No cameras found');
        return;
      }

      // Test 4: Video Stream
      console.log('🎥 Testing video stream...');
      if (videoRef.current) {
        try {
          const stream = await setupVideoStream(videoRef.current, 'user');
          streamRef.current = stream;
          updateTest('Video Stream', 'success', 'Video stream active');
          
          // Wait a bit to ensure video is actually playing
          setTimeout(() => {
            if (videoRef.current && videoRef.current.videoWidth > 0) {
              console.log('✅ Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            } else {
              console.warn('⚠️ Video element has no dimensions');
            }
          }, 1000);
        } catch (error) {
          console.error('❌ Video stream error:', error);
          updateTest('Video Stream', 'error', `Stream failed: ${error.message}`);
          return;
        }
      }

      // Test 5: Face Models
      console.log('🤖 Testing face detection models...');
      try {
        await loadModels();
        updateTest('Face Models', 'success', 'Models loaded successfully');
      } catch (error) {
        console.error('❌ Model loading error:', error);
        updateTest('Face Models', 'error', `Models failed: ${error.message}`);
      }

    } catch (error) {
      console.error('💥 Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      stopVideoStream(streamRef.current);
      streamRef.current = null;
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      runTests();
    }
    return cleanup;
  }, [isOpen]);

  const allTestsPassed = tests.every(test => test.status === 'success');
  const hasErrors = tests.some(test => test.status === 'error');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera & Face Recognition Test
          </DialogTitle>
          <DialogDescription>
            Testing camera functionality and face detection capabilities
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Test Results */}
          <div className="space-y-3">
            <h3 className="font-semibold">System Tests</h3>
            {tests.map((test) => (
              <div key={test.name} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">{test.name}</span>
                <div className="flex items-center gap-2">
                  {test.status === 'pending' && (
                    <Badge variant="secondary">
                      {isRunning ? 'Testing...' : 'Pending'}
                    </Badge>
                  )}
                  {test.status === 'success' && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  )}
                  {test.status === 'error' && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error Messages */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {tests
                    .filter(test => test.status === 'error' && test.message)
                    .map(test => (
                      <div key={test.name}>
                        <strong>{test.name}:</strong> {test.message}
                      </div>
                    ))
                  }
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Camera Preview */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Camera Preview</h4>
              <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  controls={false}
                />
                {!streamRef.current && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    No video stream
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Camera Info */}
          {cameras.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Available Cameras</h4>
                <div className="space-y-2">
                  {cameras.map((camera, index) => (
                    <div key={camera.deviceId} className="flex justify-between p-2 bg-muted rounded">
                      <span>Camera {index + 1}</span>
                      <span className="text-sm text-muted-foreground">
                        {camera.label || 'Unknown camera'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Summary */}
          {!isRunning && (
            <Alert variant={allTestsPassed ? "default" : "destructive"}>
              {allTestsPassed ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                {allTestsPassed 
                  ? "All tests passed! Camera and face recognition should work properly."
                  : "Some tests failed. Please check the error messages above and ensure camera permissions are granted."
                }
              </AlertDescription>
            </Alert>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={runTests}
              disabled={isRunning}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running Tests...' : 'Run Tests Again'}
            </Button>
            
            <Button onClick={handleClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};