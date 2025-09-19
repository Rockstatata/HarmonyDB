import { motion } from "framer-motion";
import { Music, Star, User, Bot, ListMusic, ChevronRight } from "lucide-react";
import { Link } from 'react-router-dom';
import featuresImage from "../assets/images/features.jpg";

export default function Features() {
  const features = [
    { icon: <ListMusic size={32} />, title: "Playlists", desc: "Create and manage your own playlists." },
    { icon: <Music size={32} />, title: "Streaming", desc: "Upload and stream your favorite tracks." },
    { icon: <Star size={32} />, title: "Favorites", desc: "Save songs, albums, and playlists you love." },
    { icon: <Bot size={32} />, title: "AI Assistant", desc: "Query your library in natural language." },
    { icon: <User size={32} />, title: "Artist Profiles", desc: "Discover albums and artists in detail." },
    { icon: <Music size={32} />, title: "Recently Played", desc: "Quickly access and query your recently played tracks (filter by time range)." }
  ];

  return (
    <section id="features" className="relative min-h-screen pt-32 pb-16 px-6">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${featuresImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#311D3F]/85 via-[#522546]/70 to-[#88304E]/85" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-ibm font-bold mb-6 bg-gradient-to-br from-[#E23E57] via-[#BD8182] to-[#E23E57] bg-clip-text text-transparent drop-shadow-2xl">
            Powerful Features
          </h2>
          <p className="text-xl font-poppins text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Discover everything HarmonyDB has to offer with our comprehensive suite of music management tools.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="mb-6 flex justify-center text-[#E23E57] group-hover:text-white transition-colors duration-300"
              >
                {f.icon}
              </motion.div>
              <h3 className="text-2xl font-poppins font-bold mb-4 text-white group-hover:text-gray-100 transition-colors">
                {f.title}
              </h3>
              <p className="font-poppins text-gray-200 group-hover:text-gray-100 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link
            to="/register"
          >
            <button
            className="group bg-gradient-to-r from-[#E23E57] to-[#88304E] px-8 py-4 rounded-2xl text-xl font-poppins font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-3 mx-auto"
            >
              <span>Create Account</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}