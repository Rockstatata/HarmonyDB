import { Music, ChevronRight } from "lucide-react";
import { Link } from 'react-router-dom';
import Logo from "../../assets/images/logo.png";

export default function Navbar() {
  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 w-11/12 max-w-6xl bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex justify-between items-center px-8 py-4 z-50">
      <div className="flex items-center space-x-3">
        <Link to="/" >
          <img src={Logo} alt="HarmonyDB Logo" className="h-8 w-auto" />
        </Link>
      </div>
      <Link
        to="/login"
        className="bg-gradient-to-r from-[#E23E57] to-[#88304E] px-6 py-2 rounded-xl font-poppins font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
      >
        <span>Login</span>
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
}