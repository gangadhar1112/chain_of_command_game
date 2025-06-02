import React, { useState } from 'react';
import { User, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Input from './Input';
import ImageUpload from './ImageUpload';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfileSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = async (file: File) => {
    try {
      setIsUpdating(true);
      setError('');

      const storage = getStorage();
      const storageRef = ref(storage, `profile_images/${user?.id}/${file.name}`);
      
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      await updateUserProfile({ photoURL });
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsUpdating(true);
      setError('');
      await updateUserProfile({ name: name.trim() });
      onClose();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <User className="text-purple-300 h-6 w-6 mr-2" />
        Profile Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center mb-6">
          <ImageUpload
            currentImage={user?.photoURL}
            onImageSelect={handleImageSelect}
          />
        </div>

        <Input
          label="Display Name"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your display name"
          error={error}
          disabled={isUpdating}
        />

        <div className="flex justify-end space-x-3">
          <Button
            color="secondary"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            disabled={isUpdating || !name.trim()}
          >
            {isUpdating ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Updating...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;