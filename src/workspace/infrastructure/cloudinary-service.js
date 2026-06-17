/**
 * Cloudinary upload service for chat file attachments (US11).
 * Uses the REST API directly — no SDK needed.
 */

const CLOUD_NAME   = 'dgs2up2vz';
const UPLOAD_PRESET = 'skillswap_unsigned';
const UPLOAD_URL   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validates file type and size before uploading.
 * @param {File} file
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: 'Format not allowed. Only JPG, PNG and PDF files are accepted.' };
    }
    if (file.size > MAX_SIZE_BYTES) {
        return { valid: false, error: 'File too large. Maximum size is 5MB.' };
    }
    return { valid: true, error: null };
}

/**
 * Uploads a file to Cloudinary and returns the secure URL and file name.
 * @param {File} file
 * @returns {Promise<{ fileUrl: string, fileName: string }>}
 */
export async function uploadFile(file) {
    const validation = validateFile(file);
    if (!validation.valid) throw new Error(validation.error);

    const formData = new FormData();
    formData.append('file',         file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder',       'skillswap/chat');

    const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body:   formData,
    });

    if (!response.ok) {
        throw new Error('Upload failed. Please try again.');
    }

    const data = await response.json();
    return {
        fileUrl:  data.secure_url,
        fileName: file.name,
    };
}