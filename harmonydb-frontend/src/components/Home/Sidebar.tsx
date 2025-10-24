import { NavLink, Link } from "react-router-dom";
import { Home, Search, Library, Heart, Clock, Brain, User, Music, Disc, PlusSquare } from "lucide-react";
import { useAuth } from "../../context/authContext";
import Logo from "../../assets/images/logo.png";

export default function Sidebar() {
  const { user } = useAuth();
  
  // Base navigation items for all users
  const baseNavItems = [
    { to: "/home", label: "Home", icon: <Home /> },
    { to: "/home/search", label: "Search", icon: <Search /> },
    { to: "/home/library", label: "Your Library", icon: <Library /> },
    { to: "/home/favorites", label: "Liked Songs", icon: <Heart /> },
    { to: "/home/history", label: "Recently Played", icon: <Clock /> },
    { to: "/home/ai", label: "AI Assistant", icon: <Brain /> },
    { to: "/home/playlist", label:"Playlist", icon: <PlusSquare/>}
  ];

  // Artist-specific items
  const artistNavItems = [
    { to: "/home/my-music", label: "My Music", icon: <Music /> },
    { to: "/home/my-albums", label: "My Albums", icon: <Disc /> },
    { to: "/home/upload", label: "Upload Music", icon: <PlusSquare /> }
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
              `flex items-center space-x-3 p-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-accent/20 transition-all duration-200 font-poppins ${
                isActive
                  ? "bg-gradient-primary text-white border-r-2 border-primary"
                  : ""
              }`
            }
          >
            <span className="w-6 h-6 flex items-center justify-center">
              {item.icon}
            </span>
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      

      {/* User Info */}
      <div className="mt-auto p-4 border-t border-accent/30">
        <NavLink
          to="/home/profile"
          className="flex items-center space-x-3 p-3 text-text-secondary hover:text-text-primary hover:bg-accent/20 rounded-lg transition-colors"
        >
          <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center">
            {user?.profile_picture ? (
              <img 
                src={user.profile_picture} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate font-poppins">{user?.display_name || user?.username}</p>
            <p className="text-xs text-text-muted capitalize font-poppins">{user?.role}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}