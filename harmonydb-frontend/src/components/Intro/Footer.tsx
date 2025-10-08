import { Music, Github, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-r from-[#311D3F] to-[#522546] text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E23E57] to-[#88304E] rounded-xl flex items-center justify-center">
                <Music size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-poppins font-bold bg-gradient-to-r from-[#E23E57] to-[#88304E] bg-clip-text text-transparent">
                HarmonyDB
              </h3>
            </div>
            <p className="font-poppins text-gray-300 leading-relaxed max-w-md">
              A Spotify-like music library and player with AI-powered natural language search.
              Discover, organize, and enjoy your music collection like never before.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-poppins font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="font-poppins text-gray-300 hover:text-[#E23E57] transition-colors">Features</a></li>
              <li><a href="#" className="font-poppins text-gray-300 hover:text-[#E23E57] transition-colors">About</a></li>
              <li><a href="#" className="font-poppins text-gray-300 hover:text-[#E23E57] transition-colors">Support</a></li>
              <li><a href="#" className="font-poppins text-gray-300 hover:text-[#E23E57] transition-colors">Privacy</a></li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-poppins font-semibold mb-4 text-white">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#E23E57] transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#E23E57] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#E23E57] transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="font-poppins text-gray-400 text-sm">
            © 2025 HarmonyDB. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="font-poppins text-gray-400 hover:text-[#E23E57] text-sm transition-colors">Terms of Service</a>
            <a href="#" className="font-poppins text-gray-400 hover:text-[#E23E57] text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="font-poppins text-gray-400 hover:text-[#E23E57] text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}