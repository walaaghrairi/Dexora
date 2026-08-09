import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="py-24 bg-slate-950 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-3xl bg-slate-900/40 border border-slate-800 p-12 md:p-20 text-center overflow-hidden"
        >
          {/* Animated Background Glows */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(34,211,238,0.1),_transparent_70%)]"
          />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />

          <div className="relative z-10 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/50 border border-slate-700 backdrop-blur-sm text-cyan-400 text-sm font-medium"
            >
              <Sparkles size={14} /> Start Today
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-white"
            >
              Ready to Master <br /> Tunisian Sign Language?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              Join Dexora and start learning with AI-powered lessons, real-time recognition, interactive practice and personalized progress tracking.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link
                to="/register"
                className="w-full sm:w-auto px-10 py-5 rounded-xl font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2"
              >
                Get Started <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-10 py-5 rounded-xl font-semibold bg-slate-900/50 text-white border border-slate-700 backdrop-blur-sm hover:bg-slate-800 transition-all duration-300 ease-in-out"
              >
                Login
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
