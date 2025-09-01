// Camera utilities and permission checks
export const checkCameraSupport = () => {
  console.log('Checking camera support...');
  
  if (!navigator.mediaDevices) {
    console.error('mediaDevices not supported');
    return { supported: false, error: 'Camera not supported in this browser' };
  }

  if (!navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia not supported');
    return { supported: false, error: 'Camera access not supported in this browser' };
  }

  console.log('Camera APIs supported');
  return { supported: true };
};

export const requestCameraPermission = async (): Promise<{ granted: boolean; error?: string }> => {
  try {
    console.log('Requesting camera permission...');
    
    // Check if permissions API is available
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log('Camera permission status:', permission.state);
      
      if (permission.state === 'denied') {
        return { granted: false, error: 'Camera permission denied. Please enable camera access in browser settings.' };
      }
    }

    // Test camera access
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log('Camera permission granted');
    
    // Stop the test stream immediately
    stream.getTracks().forEach(track => track.stop());
    
    return { granted: true };
  } catch (error: any) {
    console.error('Camera permission error:', error);
    
    if (error.name === 'NotAllowedError') {
      return { granted: false, error: 'Camera access denied. Please allow camera permissions and try again.' };
    } else if (error.name === 'NotFoundError') {
      return { granted: false, error: 'No camera found on this device.' };
    } else if (error.name === 'NotReadableError') {
      return { granted: false, error: 'Camera is being used by another application.' };
    } else if (error.name === 'SecurityError') {
      return { granted: false, error: 'Camera access blocked by security settings. Try using HTTPS.' };
    }
    
    return { granted: false, error: `Camera permission error: ${error.message}` };
  }
};

export const getCameraDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    console.log('Available camera devices:', videoDevices.length);
    return videoDevices;
  } catch (error) {
    console.error('Error enumerating devices:', error);
    return [];
  }
};