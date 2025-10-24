import { useState, useEffect } from 'react';
import { User, Edit, Camera, Save, LogOut } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { useAuth } from '../../context/authContext';
import type { User as UserType } from '../../types';

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<Partial<UserType>>({});
  const [loading, setLoading] = useState(false);

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

      const updatedUser = await apiService.updateProfile(formData);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
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
              {user.profile_picture ? (
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
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Camera size={16} className="text-white" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-white">
                {user.display_name || user.username}
              </h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
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
              <div className={`w-3 h-3 rounded-full ${user.email_verified ? 'bg-green-500' : 'bg-red-500'}`} />
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
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
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
          <h3 className="text-lg font-semibold text-white mb-4">Account Actions</h3>
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
  );
};

export default Profile;