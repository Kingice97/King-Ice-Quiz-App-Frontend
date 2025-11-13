import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading/Loading';
import './ProfilePictureUpload.css';

const ProfilePictureUpload = ({ onSuccess, onCancel }) => {
  const { updateProfilePicture } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await updateProfilePicture(selectedFile);
      onSuccess();
      
    } catch (error) {
      setError(error.message || 'Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      // You can implement remove functionality here if needed
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      setError(error.message || 'Failed to remove profile picture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-picture-upload">
      <div className="upload-header">
        <h3>Update Profile Picture</h3>
        <p>Choose a new image for your profile</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="upload-content">
        {/* Preview */}
        <div className="preview-section">
          <div className="preview-container">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="preview-image" />
            ) : (
              <div className="preview-placeholder">
                <div className="placeholder-icon">📷</div>
                <p>No image selected</p>
              </div>
            )}
          </div>
        </div>

        {/* File Input */}
        <div className="file-input-section">
          <label htmlFor="profile-picture-input" className="file-input-label">
            Choose Image
          </label>
          <input
            id="profile-picture-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
          />
          <div className="file-info">
            <p>Supported formats: JPG, PNG, GIF</p>
            <p>Max file size: 5MB</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="upload-actions">
        <button
          onClick={onCancel}
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        {previewUrl && (
          <button
            onClick={handleRemove}
            className="btn btn-outline"
            disabled={loading}
          >
            Remove
          </button>
        )}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className="btn btn-primary"
        >
          {loading ? <Loading size="small" /> : 'Upload Picture'}
        </button>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;