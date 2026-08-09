import { motion } from 'motion/react';
import { ChevronDown, Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Dynamic Background Glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px]"
      />
      <div className="absolute top-1/4 right-[10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />

      <div className="relative z-10 text-center px-6 max-w-4xl space-y-8">
        {/* AI Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700 backdrop-blur-sm text-cyan-400 text-sm font-medium mb-2"
        >
          <Sparkles size={14} /> AI Powered
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent"
        >
          DEXORA
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-xl md:text-2xl text-slate-300 font-medium"
        >
          AI-Powered Tunisian Sign Language <br className="hidden md:block" /> Learning Platform
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-lg text-slate-400 max-w-2xl mx-auto"
        >
          Master Tunisian Sign Language with interactive lessons, AI-powered recognition, and personalized learning journeys.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link
            to="/register"
            className="w-full sm:w-auto px-10 py-5 rounded-xl font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            Get Started
          </Link>
          <button className="w-full sm:w-auto px-10 py-5 rounded-xl font-semibold bg-slate-900/50 text-white border border-slate-700 backdrop-blur-sm hover:bg-slate-800 transition-all duration-300 ease-in-out flex items-center justify-center gap-2">
            <Play size={18} fill="currentColor" /> Watch Demo
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500"
      >
        <span className="text-xs font-semibold tracking-widest uppercase">Scroll</span>
        <ChevronDown size={24} />
      </motion.div>
    </section>
  );
};

export default Hero;
