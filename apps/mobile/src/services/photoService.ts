import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { API_URL } from './api';

export interface PhotoUploadData {
    uri: string;
    itemId: string;
    itemName: string;
    status: 'OK' | 'PROBLEM';
    notes?: string;
}

class PhotoService {
    /**
     * Compresses a photo using WebP format to reduce size without losing quality.
     * @param uri The original photo URI
     * @returns A new URI for the compressed WebP image
     */
    async compressPhoto(uri: string): Promise<string> {
        try {
            console.log(`[PhotoService] 🌀 Compressing image: ${uri}`);
            
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 1200 } }], // Resize to a sane maximum width
                { 
                    compress: 0.8, 
                    format: ImageManipulator.SaveFormat.WEBP 
                }
            );

            console.log(`[PhotoService] ✅ Compression done: ${result.uri} (${result.width}x${result.height})`);
            return result.uri;
        } catch (error) {
            console.error('[PhotoService] ❌ Compression failed, using original:', error);
            return uri;
        }
    }

    /**
     * Uploads a single photo to the backend with automatic compression.
     */
    async uploadPhoto(photoUri: string, token: string): Promise<string | null> {
        try {
            // 1. Compress first
            const compressedUri = await this.compressPhoto(photoUri);
            
            // 2. Prepare FormData
            const formData = new FormData();
            const filename = compressedUri.split('/').pop() || 'photo.webp';

            // Create file object for upload
            // @ts-ignore - FormData in React Native accepts this object
            formData.append('file', {
                uri: compressedUri,
                type: 'image/webp',
                name: filename,
            });

            console.log(`[PhotoService] 📤 Uploading to: ${API_URL}/storage/upload`);

            const response = await fetch(`${API_URL}/storage/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[PhotoService] ❌ Upload failed:', errorText);
                return null;
            }

            const data = await response.json();
            
            // 3. Clean up the compressed temporary file
            try {
                if (compressedUri !== photoUri) {
                    await FileSystem.deleteAsync(compressedUri, { idempotent: true });
                }
            } catch (cleanupError) {
                console.warn('[PhotoService] Cleanup failed:', cleanupError);
            }

            return data.url;
        } catch (error) {
            console.error('[PhotoService] ❌ Global upload error:', error);
            return null;
        }
    }
}

export const photoService = new PhotoService();

/**
 * Helper to get current location for journey start/end
 */
export async function getCaptureLocation(): Promise<{ lat: number; lng: number } | null> {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            console.warn('[PhotoService] Location permission not granted');
            return null;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
        };
    } catch (error) {
        console.error('[PhotoService] Error getting capture location:', error);
        return null;
    }
}
