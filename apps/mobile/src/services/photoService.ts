import * as Location from 'expo-location';

export interface PhotoUploadData {
    uri: string;
    itemId: string;
    itemName: string;
    status: 'OK' | 'PROBLEM';
    notes?: string;
}

class PhotoService {
    /**
     * Compresses and uploads a single photo to the backend
     */
    async uploadPhoto(photoUri: string, token: string): Promise<string | null> {
        try {
            // In React Native, we need to create FormData
            const formData = new FormData();

            // Extract filename from URI
            const filename = photoUri.split('/').pop() || 'photo.jpg';

            // Create file object for upload
            formData.append('file', {
                uri: photoUri,
                type: 'image/jpeg',
                name: filename,
            } as any);

            const response = await fetch('https://api.johnatamoreira.com.br/storage/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type - browser/RN will set it with boundary
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed:', errorText);
                return null;
            }

            const data = await response.json();
            return data.url; // Backend returns { url: "https://..." }
        } catch (error) {
            console.error('Error uploading photo:', error);
            return null;
        }
    }

    /**
     * Uploads multiple photos with retry logic
     */
    async uploadPhotos(photos: PhotoUploadData[], token: string): Promise<Map<string, string>> {
        const urlMap = new Map<string, string>();

        for (const photo of photos) {
            let attempts = 0;
            let url: string | null = null;

            // Retry up to 3 times
            while (attempts < 3 && !url) {
                attempts++;
                console.log(`Uploading ${photo.itemName} (attempt ${attempts}/3)...`);

                url = await this.uploadPhoto(photo.uri, token);

                if (!url && attempts < 3) {
                    // Wait 2s before retry
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            if (url) {
                urlMap.set(photo.itemId, url);
                console.log(`✅ ${photo.itemName} uploaded: ${url}`);
            } else {
                console.warn(`❌ Failed to upload ${photo.itemName} after 3 attempts`);
            }
        }

        return urlMap;
    }

    /**
     * Queues photos for offline upload
     * Stores in AsyncStorage and retries when online
     */
    async queueOfflineUpload(photos: PhotoUploadData[]): Promise<void> {
        // TODO: Implement AsyncStorage queue for offline support
        console.log('Queuing photos for offline upload:', photos.length);
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
            console.warn('Location permission not granted');
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
        console.error('Error getting capture location:', error);
        return null;
    }
}
