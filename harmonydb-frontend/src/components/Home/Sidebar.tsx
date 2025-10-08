import { NavLink, Link } from "react-router-dom";
import { Home, Search, Library, Heart, Clock, Brain, User } from "lucide-react";
import { useAuth } from "../../context/authContext";
import Logo from "../../assets/images/logo.png";

export default function Sidebar() {
  const { user } = useAuth();
  const navItems = [
    { to: "/home", label: "Home", icon: <Home /> },
    { to: "/search", label: "Search", icon: <Search /> },
    { to: "/library", label: "Library", icon: <Library /> },
    { to: "/favorites", label: "Favorites", icon: <Heart /> },
    { to: "/history", label: "History", icon: <Clock /> },
    { to: "/ai", label: "AI Query", icon: <Brain /> }
  ];

  // Add admin panel if user is admin (assuming role check)
  if (user?.role === 'admin') {
    navItems.push({ to: "/admin", label: "Admin", icon: <User /> });
  }

  return (
    <aside className="bg-dark text-text-primary w-60 flex flex-col p-4 space-y-2 min-h-screen glass md:w-64 lg:w-72"> {/* Responsive width, glass effect */}
      <div className="flex items-center space-x-3 m-8">
        <Link to="/" className="hover:opacity-80 transition">
          <img src={Logo} alt="HarmonyDB Logo" className="h-8 w-auto" />
        </Link>
      </div>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-xl hover:bg-primary-300 transition-all duration-200 ${
              isActive
                ? "bg-gradient-primary text-text-primary shadow-lg"  // Active with gradient
                : "text-text-primary hover:text-text-primary"
            }`
          }
        >
          {item.icon}
          <span className="font-medium">{item.label}</span>
        </NavLink>
      ))}
      {/* Optional: Add a footer or user info */}
      <div className="mt-auto pt-4 border-t border-border-light">
        <p className="text-text-muted text-sm">Logged in as {user?.username}</p>
      </div>
    </aside>
  );
}