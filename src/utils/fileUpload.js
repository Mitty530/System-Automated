// File upload utilities for Supabase Storage integration
import { supabase } from '../lib/supabase.js';

/**
 * Generate a unique file path for storage
 * @param {string} fileName - Original file name
 * @param {number} requestId - Request ID (optional, for organization)
 * @returns {string} - Unique file path
 */
export const generateFilePath = (fileName, requestId = null) => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileExtension = fileName.split('.').pop();
  const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_');
  
  if (requestId) {
    return `requests/${timestamp}/req_${requestId}/${baseName}_${randomId}.${fileExtension}`;
  }
  
  return `documents/${timestamp}/${baseName}_${randomId}.${fileExtension}`;
};

/**
 * Upload a single file to Supabase Storage
 * @param {File} file - File object to upload
 * @param {number} requestId - Request ID for organization
 * @returns {Promise<object>} - Upload result with file path and metadata
 */
export const uploadFile = async (file, requestId = null) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(`File size exceeds 50MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type not supported: ${file.type}`);
    }

    // Generate unique file path
    const filePath = generateFilePath(file.name, requestId);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Return file metadata
    return {
      success: true,
      filePath: uploadData.path,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload multiple files to Supabase Storage
 * @param {File[]} files - Array of file objects
 * @param {number} requestId - Request ID for organization
 * @param {function} onProgress - Progress callback (optional)
 * @returns {Promise<object>} - Upload results
 */
export const uploadMultipleFiles = async (files, requestId = null, onProgress = null) => {
  try {
    if (!files || files.length === 0) {
      return { success: true, files: [], errors: [] };
    }

    const uploadPromises = files.map(async (file, index) => {
      try {
        const result = await uploadFile(file, requestId);
        
        if (onProgress) {
          onProgress({
            completed: index + 1,
            total: files.length,
            currentFile: file.name,
            success: result.success
          });
        }

        return result;
      } catch (error) {
        return {
          success: false,
          fileName: file.name,
          error: error.message
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    const successfulUploads = results.filter(r => r.success);
    const failedUploads = results.filter(r => !r.success);

    return {
      success: failedUploads.length === 0,
      files: successfulUploads,
      errors: failedUploads,
      totalUploaded: successfulUploads.length,
      totalFailed: failedUploads.length
    };

  } catch (error) {
    console.error('Error uploading multiple files:', error);
    return {
      success: false,
      files: [],
      errors: [{ error: error.message }]
    };
  }
};

/**
 * Save file metadata to database
 * @param {number} requestId - Request ID
 * @param {object} fileMetadata - File metadata from upload
 * @param {string} userId - User ID who uploaded the file
 * @returns {Promise<object>} - Database insert result
 */
export const saveFileMetadata = async (requestId, fileMetadata, userId) => {
  try {
    console.log('Saving file metadata:', {
      requestId,
      fileMetadata,
      userId
    });

    const insertData = {
      request_id: requestId,
      file_name: fileMetadata.fileName,
      file_path: fileMetadata.filePath,
      file_size: fileMetadata.fileSize,
      file_type: fileMetadata.fileType,
      uploaded_by: userId,
      uploaded_at: fileMetadata.uploadedAt || new Date().toISOString()
    };

    console.log('Insert data:', insertData);

    const { data, error } = await supabase
      .from('request_documents')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Database error saving file metadata:', error);
      throw error;
    }

    console.log('File metadata saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving file metadata:', error);
    throw error;
  }
};

/**
 * Get download URL for a file
 * @param {string} filePath - File path in storage
 * @returns {Promise<string>} - Signed download URL
 */
export const getFileDownloadUrl = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

/**
 * Delete a file from storage and database
 * @param {string} filePath - File path in storage
 * @param {number} documentId - Document ID in database
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFile = async (filePath, documentId) => {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('request_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw dbError;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Get all documents for a request
 * @param {number} requestId - Request ID
 * @returns {Promise<array>} - Array of document metadata
 */
export const getRequestDocuments = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('request_documents')
      .select(`
        *,
        uploaded_by_profile:user_profiles!uploaded_by(full_name)
      `)
      .eq('request_id', requestId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching request documents:', error);
    return [];
  }
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {object} - Validation result
 */
export const validateFile = (file) => {
  const errors = [];
  
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File size exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

  // Check file type
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.xls', '.xlsx'];
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push(`File type not supported: ${fileExtension}`);
  }

  // Check file name length
  if (file.name.length > 255) {
    errors.push('File name too long (max 255 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
