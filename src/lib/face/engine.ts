import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

export interface FaceMatch {
  studentId: string;
  distance: number;
  confidence: number;
}

const MATCH_THRESHOLD = 0.6; // Lower = more strict

export const loadModels = async (): Promise<void> => {
  if (modelsLoaded) return;

  try {
    console.log('🤖 Loading face detection models...');
    
    // Test different model sources with better error handling
    const modelSources = [
      '/models',
      'https://raw.githubusercontent.com/vladmandic/face-api/master/model',
      'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model'
    ];

    let lastError: Error | null = null;
    
    for (const source of modelSources) {
      try {
        console.log(`📂 Trying to load models from: ${source}`);
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(source),
          faceapi.nets.faceLandmark68Net.loadFromUri(source),
          faceapi.nets.faceRecognitionNet.loadFromUri(source),
        ]);
        
        console.log(`✅ Models loaded successfully from: ${source}`);
        modelsLoaded = true;
        return;
      } catch (error) {
        console.warn(`❌ Failed to load from ${source}:`, error);
        lastError = error as Error;
        continue;
      }
    }
    
    throw lastError || new Error('All model sources failed');
  } catch (error) {
    console.error('💥 Failed to load face detection models from all sources:', error);
    modelsLoaded = false;
    throw new Error(`Unable to load face detection models: ${error.message}`);
  }
};

export const getDescriptorFromVideoFrame = async (video: HTMLVideoElement): Promise<number[] | null> => {
  try {
    if (!modelsLoaded) {
      await loadModels();
    }

    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      return null;
    }

    return Array.from(detections.descriptor);
  } catch (error) {
    console.error('Error extracting face descriptor:', error);
    return null;
  }
};

export const getDescriptorFromImageElement = async (img: HTMLImageElement): Promise<number[] | null> => {
  try {
    if (!modelsLoaded) {
      await loadModels();
    }

    const detections = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      return null;
    }

    return Array.from(detections.descriptor);
  } catch (error) {
    console.error('Error extracting face descriptor from image:', error);
    return null;
  }
};

export const euclideanDistance = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Descriptors must have the same length');
  }
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

export const findBestMatch = (
  inputDescriptor: number[], 
  enrolledFaces: { studentId: string; descriptor: number[] }[],
  threshold: number = MATCH_THRESHOLD
): FaceMatch | null => {
  if (!enrolledFaces.length) return null;

  let bestMatch: FaceMatch | null = null;
  let minDistance = Infinity;

  for (const enrolled of enrolledFaces) {
    try {
      const distance = euclideanDistance(inputDescriptor, enrolled.descriptor);
      
      if (distance < minDistance && distance < threshold) {
        minDistance = distance;
        bestMatch = {
          studentId: enrolled.studentId,
          distance,
          confidence: Math.max(0, 1 - distance) // Convert distance to confidence
        };
      }
    } catch (error) {
      console.error('Error comparing descriptors:', error);
    }
  }

  return bestMatch;
};

export const setupVideoStream = async (
  videoElement: HTMLVideoElement,
  facingMode: 'user' | 'environment' = 'user'
): Promise<MediaStream> => {
  console.log('🎥 Setting up video stream with facing mode:', facingMode);
  
  try {
    // Stop any existing stream first
    const currentStream = videoElement.srcObject as MediaStream;
    if (currentStream) {
      console.log('🛑 Stopping existing stream');
      currentStream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }

    // Check if mediaDevices is available
    if (!navigator.mediaDevices) {
      console.error('❌ mediaDevices not available');
      throw new Error('Camera not supported in this browser');
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia not available');
      throw new Error('Camera access not supported in this browser');
    }

    // Enhanced constraints with better fallbacks and debugging
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 640, min: 320, max: 1280 },
        height: { ideal: 480, min: 240, max: 720 },
        frameRate: { ideal: 30, min: 10, max: 60 }
      },
      audio: false
    };

    console.log('📱 Available cameras:', await navigator.mediaDevices.enumerateDevices().then(devices => 
      devices.filter(d => d.kind === 'videoinput').map(d => ({ label: d.label, deviceId: d.deviceId }))
    ));

    console.log('📋 Requesting media stream with constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('✅ Media stream obtained:', stream.getTracks().map(t => ({
      kind: t.kind,
      label: t.label,
      enabled: t.enabled,
      readyState: t.readyState
    })));

    // Configure video element BEFORE setting srcObject
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.controls = false;
    
    // Set the stream
    videoElement.srcObject = stream;
    console.log('🔗 Stream assigned to video element');
    
    // Wait for video to be ready with timeout
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏰ Video setup timeout after 10 seconds');
        reject(new Error('Video setup timeout - camera may not be accessible'));
      }, 10000);

      const onLoadedMetadata = () => {
        console.log('📐 Video metadata loaded - dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
        clearTimeout(timeout);
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.removeEventListener('error', onError);
        
        // Force play after metadata is loaded
        videoElement.play()
          .then(() => {
            console.log('▶️ Video play started successfully');
            resolve();
          })
          .catch((playError) => {
            console.error('❌ Video play failed:', playError);
            reject(new Error(`Video playback failed: ${playError.message}`));
          });
      };

      const onError = (error: Event) => {
        console.error('❌ Video error event:', error);
        clearTimeout(timeout);
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.removeEventListener('error', onError);
        reject(new Error('Video failed to load - check camera permissions'));
      };

      // If metadata is already loaded, resolve immediately
      if (videoElement.readyState >= 1) {
        console.log('📐 Video metadata already loaded');
        clearTimeout(timeout);
        onLoadedMetadata();
        return;
      }

      videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      videoElement.addEventListener('error', onError);
    });

    console.log('🎊 Video stream setup complete successfully');
    return stream;
  } catch (error) {
    console.error('💥 Video stream setup failed:', error);
    
    // Ensure video element is cleared on failure
    if (videoElement.srcObject) {
      const failedStream = videoElement.srcObject as MediaStream;
      failedStream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    
    // Provide more specific error messages
    if (error.name === 'NotAllowedError') {
      throw new Error('Camera access denied. Please allow camera permissions and try again.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No camera found on this device.');
    } else if (error.name === 'NotReadableError') {
      throw new Error('Camera is being used by another application.');
    } else if (error.name === 'OverconstrainedError') {
      throw new Error('Camera constraints cannot be satisfied.');
    } else if (error.name === 'SecurityError') {
      throw new Error('Camera access blocked by security settings. Try using HTTPS.');
    } else {
      throw new Error(`Camera setup failed: ${error.message || 'Unknown error'}`);
    }
  }
};

export const stopVideoStream = (stream: MediaStream): void => {
  stream.getTracks().forEach(track => track.stop());
};

export const captureFrameAsBlob = (video: HTMLVideoElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Unable to get canvas context'));
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to capture frame'));
      }
    }, 'image/jpeg', 0.8);
  });
};