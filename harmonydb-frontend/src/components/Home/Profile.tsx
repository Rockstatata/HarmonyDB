import { useState, useEffect, useRef } from 'react';
import { User, Edit, Camera, Save, LogOut, Lock, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { useAuth } from '../../context/authContext';
import type { User as UserType } from '../../types';

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<Partial<UserType>>({});
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
        stage_name: user.stage_name || '',
        birth_date: user.birth_date || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Add profile picture if selected
      if (selectedImage) {
        formData.append('profile_picture', selectedImage);
      }

      const updatedUser = await apiService.updateProfile(formData);
      setUser(updatedUser);
      setIsEditing(false);
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiService.changePassword(passwordForm);
      alert('Password changed successfully');
      setShowChangePassword(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-gray-900/40 rounded-lg p-8">
        {/* Profile Header */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile Preview" 
                  className="w-full h-full object-cover"
                />
              ) : user.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-gray-400" />
              )}
            </div>
            {isEditing && (
              <button
                onClick={handleCameraClick}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors"
              >
                <Camera size={16} className="text-white" />
              </button>
            )}
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-white">
                {user.display_name || user.username}
              </h1>
              <button
                onClick={() => {
                  if (isEditing) {
                    // Cancel editing - reset to original data
                    setProfileData({
                      username: user.username,
                      email: user.email,
                      bio: user.bio || '',
                      stage_name: user.stage_name || '',
                      birth_date: user.birth_date || '',
                    });
                    setSelectedImage(null);
                    setImagePreview(null);
                  }
                  setIsEditing(!isEditing);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit size={16} className="text-white" />
                <span className="text-white">{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>
            <p className="text-gray-400 capitalize">{user.role}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border-none outline-none focus:bg-gray-700 transition-colors"
              />
            ) : (
              <p className="text-white">{user.username}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            {isEditing ? (
              <textarea
                value={profileData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border-none outline-none focus:bg-gray-700 transition-colors resize-none"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-white">{user.bio || 'No bio provided'}</p>
            )}
          </div>

          {/* Artist-specific fields */}
          {user.role === 'artist' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stage Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.stage_name || ''}
                  onChange={(e) => handleInputChange('stage_name', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border-none outline-none focus:bg-gray-700 transition-colors"
                  placeholder="Your artist name"
                />
              ) : (
                <p className="text-white">{user.stage_name || 'No stage name set'}</p>
              )}
            </div>
          )}

          {/* Listener-specific fields */}
          {user.role === 'listener' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Birth Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={profileData.birth_date || ''}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border-none outline-none focus:bg-gray-700 transition-colors"
                />
              ) : (
                <p className="text-white">
                  {user.birth_date ? new Date(user.birth_date).toLocaleDateString() : 'No birth date set'}
                </p>
              )}
            </div>
          )}

          {/* Email Verification Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Status</label>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${user.email_verified ? 'bg-primary' : 'bg-accent'}`} />
              <span className="text-white">
                {user.email_verified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary/80 disabled:bg-surface disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Save size={16} className="text-white" />
              <span className="text-white">{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Account Stats */}
      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="bg-gray-900/40 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Account Created</h3>
          <p className="text-gray-400">
            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
        <div className="bg-gray-900/40 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Last Updated</h3>
          <p className="text-gray-400">
            {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
      </div>

      {/* Account Actions */}
      <div className="mt-8">
        <div className="bg-gray-900/40 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
          <div className="space-y-4">
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Lock size={16} className="text-white" />
              <span className="text-white">Change Password</span>
            </button>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut size={16} className="text-white" />
              <span className="text-white">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">Must be at least 8 characters long</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirm_new_password}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm_new_password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordForm({
                      current_password: '',
                      new_password: '',
                      confirm_new_password: ''
                    });
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 rounded text-white transition-colors"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;