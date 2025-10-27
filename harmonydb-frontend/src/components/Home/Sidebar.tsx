import { NavLink, Link } from "react-router-dom";
import { Home, Library, Heart, Clock, Brain, Music, Users } from "lucide-react";
import { useAuth } from "../../context/authContext";
import Logo from "../../assets/images/logo.png";

export default function Sidebar() {
  const { user } = useAuth();
  
  // Base navigation items for all users
  const baseNavItems = [
    { to: "/home", label: "Home", icon: <Home /> },
    { to: "/home/library", label: "Your Library", icon: <Library /> },
    { to: "/home/artists", label: "Artists", icon: <Users /> },
    { to: "/home/favorites", label: "Liked Songs", icon: <Heart /> },
    { to: "/home/history", label: "Recently Played", icon: <Clock /> },
    { to: "/home/ai", label: "Melo AI", icon: <Brain /> }
  ];

  // Artist-specific items
  const artistNavItems = [
    { to: "/home/my-music", label: "My Music", icon: <Music /> }
  ];

  const navItems = user?.role === 'artist' 
    ? [...baseNavItems, ...artistNavItems] 
    : baseNavItems;

  return (
    <aside className="bg-dark w-64 flex flex-col p-2 min-h-screen border-r border-accent/30">
      {/* Logo */}
      <div className="flex items-center space-x-3 p-6">
        <Link to="/home" className="hover:opacity-80 transition">
          <img src={Logo} alt="HarmonyDB Logo" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-poppins ${
                isActive
                  ? "bg-accent text-text-primary"
                  : "text-text-muted hover:text-text-primary hover:bg-surface/50"
              }`
            }
          >
            <span className="w-5 h-5">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Role Badge */}
      <div className="mt-6 px-6">
        <div className={`px-3 py-2 rounded-lg text-center text-xs font-medium ${
          user?.role === 'artist' 
            ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
            : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
        }`}>
          {user?.role === 'artist' ? '🎵 Artist Account' : '🎧 Music Listener'}
        </div>
        {user?.role === 'artist' && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Upload songs, create albums, and manage your music
          </p>
        )}
      </div>

    </aside>
  );
}