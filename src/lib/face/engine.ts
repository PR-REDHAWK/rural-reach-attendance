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
    console.log('Loading face detection models...');
    
    // Load models - use the CDN if local models fail
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ]).catch(async () => {
      // Fallback to CDN if local models fail
      console.log('Local models failed, loading from CDN...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model'),
        faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model'),
      ]);
    });

    modelsLoaded = true;
    console.log('Face detection models loaded successfully');
  } catch (error) {
    console.error('Failed to load face detection models:', error);
    throw new Error('Unable to load face detection models');
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
  try {
    console.log('Setting up video stream...', { facingMode });
    
    // Check if mediaDevices is available
    if (!navigator.mediaDevices) {
      console.error('mediaDevices not available');
      throw new Error('Camera not supported in this browser');
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia not available');
      throw new Error('Camera access not supported in this browser');
    }

    console.log('Requesting camera access...');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode
      }
    });

    console.log('Camera access granted, setting up video element...');
    videoElement.srcObject = stream;
    videoElement.playsInline = true;
    videoElement.muted = true; // Ensure muted for autoplay
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('Video loading timeout');
        reject(new Error('Video loading timeout'));
      }, 10000); // 10 second timeout

      videoElement.onloadedmetadata = () => {
        console.log('Video metadata loaded, starting playback...');
        clearTimeout(timeout);
        videoElement.play()
          .then(() => {
            console.log('Video playback started successfully');
            resolve(stream);
          })
          .catch((playError) => {
            console.error('Video play error:', playError);
            reject(new Error(`Video playback failed: ${playError.message}`));
          });
      };
      
      videoElement.onerror = (error) => {
        console.error('Video element error:', error);
        clearTimeout(timeout);
        reject(new Error('Video element error'));
      };
    });
  } catch (error) {
    console.error('Error setting up video stream:', error);
    
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
      throw new Error('Camera access blocked by security settings.');
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