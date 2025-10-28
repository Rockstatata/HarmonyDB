import { useState } from 'react';
import { Search as SearchIcon, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const Header = () => {
  const [query, setQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSearchClick = () => {
    navigate('/home/search');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/home/search?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/home/search');
    }
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleProfileNavigation = () => {
    setShowProfileDropdown(false);
    navigate('/home/profile');
  };

  const handleLogout = () => {
    setShowProfileDropdown(false);
    logout();
    navigate('/');
  };

  return (
    <header className="bg-dark/80 backdrop-blur-sm border-b border-accent/30 p-4 relative z-50">
      <div className="flex items-center justify-between w-full px-4">
        {/* Left Side - Can be used for additional elements */}
        <div className="w-64"></div>

        {/* Search Bar - Centered */}
        <div className="flex-1 max-w-md mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="What do you want to listen to?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={handleSearchClick}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-full border-none outline-none focus:bg-gray-700 transition-colors cursor-pointer"
            />
          </form>
        </div>

        

        {/* Profile Section - Right Side */}
        {user && (
          <div className="relative z-50">
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-3 hover:bg-gray-800/50 px-3 py-2 rounded-lg transition-colors"
            >
              {/* Profile Picture */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} className="text-white" />
                )}
              </div>

              {/* User Info */}
              <div className="hidden md:block text-left">
                <p className="text-white text-sm font-medium truncate max-w-32">
                  {user.display_name || user.username}
                </p>
                <p className="text-gray-400 text-xs capitalize">
                  {user.role}
                </p>
              </div>

              {/* Dropdown Arrow */}
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[100]">
                {/* Profile Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {user.email}
                      </p>
                      <p className="text-gray-500 text-xs capitalize">
                        {user.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="py-2">
                  <button
                    onClick={handleProfileNavigation}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <User size={18} />
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={handleProfileNavigation}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <Settings size={18} />
                    <span>Account Settings</span>
                  </button>
                  <div className="border-t border-gray-700 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {showProfileDropdown && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setShowProfileDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;