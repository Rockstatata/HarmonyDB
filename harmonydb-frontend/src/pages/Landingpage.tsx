import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";

export default function Landingpage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#311D3F] to-[#88304E] text-white font-poppins overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}