/**
 * Web stub for react-native-vision-camera.
 * Metro resolves this module via `resolver.extraNodeModules` on web builds,
 * preventing the native initialiser from running in the browser.
 */

// Minimal no-op exports that satisfy all imports in the app
export const CameraModule = null;

export class Camera {
    static getCameraPermissionStatus() { return 'denied'; }
    static requestCameraPermission() { return Promise.resolve('denied'); }
    static getMicrophonePermissionStatus() { return 'denied'; }
    static requestMicrophonePermission() { return Promise.resolve('denied'); }
    takePhoto() { return Promise.reject(new Error('Camera not available on web')); }
    render() { return null; }
}

export function useCameraPermission() {
    return { hasPermission: false, requestPermission: () => Promise.resolve(false) };
}

export function useMicrophonePermission() {
    return { hasPermission: false, requestPermission: () => Promise.resolve(false) };
}

export function useCameraDevice(_position) {
    return null;
}

export function useCameraFormat(_device, _fps) {
    return null;
}

export function useFrameProcessor() {}

export function useCameraDevices() {
    return { back: null, front: null };
}

export default Camera;
