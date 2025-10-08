import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from 'react-router-dom';
import heroImage from "../../assets/images/hero.jpg";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#311D3F]/80 via-[#522546]/60 to-[#88304E]/80" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-7xl md:text-8xl font-poppins font-extrabold mb-6 bg-gradient-to-br from-[#E23E57] via-[#BD8182] to-[#E23E57] bg-clip-text text-transparent drop-shadow-2xl">
            HarmonyDB
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl md:text-2xl font-poppins mb-12 max-w-2xl mx-auto text-gray-200 leading-relaxed drop-shadow-lg"
        >
          A Spotify-like music library and player with AI-powered natural language search.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Link
            to="/login"
            >
                <button className="group bg-gradient-to-r from-[#E23E57] to-[#88304E] px-6 py-4 rounded-2xl text-xl font-poppins font-bold hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center space-x-3 mx-auto">
                    <span>Get Started</span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-white/70 rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
}