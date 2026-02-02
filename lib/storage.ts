import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

export async function uploadProfilePicture(userId: string, imageUri: string): Promise<string | null> {
  try {
    console.log('🔍 Storage: Starting upload for user:', userId);
    console.log('🔍 Storage: Image URI:', imageUri);

    // Generate a unique filename
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/profile.${fileExt}`;

    // Convert image URI to blob with proper handling
    const response = await fetch(imageUri);
    const blob = await response.blob();

    console.log('🔍 Storage: Blob size:', blob.size, 'bytes');
    console.log('🔍 Storage: Blob type:', blob.type);

    if (blob.size === 0) {
      console.error('🔍 Storage: Error - Image blob is 0 bytes');
      return null;
    }

    // Convert blob to base64
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(',')[1]; // Remove data URL prefix

        console.log('🔍 Storage: Base64 data length:', base64Data.length);

        // Convert base64 to Uint8Array (clean & reliable)
        const uint8Array = new Uint8Array(decode(base64Data));
        console.log('🔍 Storage: Uint8Array size:', uint8Array.length, 'bytes');

        // Upload to Supabase storage using Uint8Array directly
        const { data, error } = await supabase.storage
          .from('profiles')
          .upload(fileName, uint8Array, {
            cacheControl: '3600',
            contentType: blob.type,
            upsert: true,
          });

        if (error) {
          console.error('🔍 Storage: Upload error:', error);
          resolve(null);
          return;
        }

        console.log('🔍 Storage: Upload successful:', data);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName);

        console.log('🔍 Storage: Public URL:', publicUrl);
        resolve(publicUrl);
      };

      reader.onerror = () => {
        console.error('🔍 Storage: FileReader error');
        resolve(null);
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('🔍 Storage: Upload error:', error);
    return null;
  }
}

export async function deleteProfilePicture(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('profiles')
      .remove([`${userId}/profile`]);

    return !error;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}
