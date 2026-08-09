import { motion } from 'motion/react';
import { Brain, BookOpen, Camera, Trophy, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    title: 'AI Recognition',
    description: 'Use artificial intelligence to recognize Tunisian Sign Language in real time.',
    icon: Brain,
  },
  {
    title: 'Interactive Lessons',
    description: 'Structured lessons designed to progressively improve your skills.',
    icon: BookOpen,
  },
  {
    title: 'Live Translator',
    description: 'Translate signs instantly using your webcam.',
    icon: Camera,
  },
  {
    title: 'Progress Tracking',
    description: 'Track your learning journey with achievements and statistics.',
    icon: Trophy,
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700 backdrop-blur-sm text-cyan-400 text-sm font-medium"
          >
            <Sparkles size={14} /> Features
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white"
          >
            Everything you need to master Tunisian Sign Language
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg"
          >
            A modern AI-powered platform combining interactive learning, real-time recognition and personalized progress tracking.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-sm transition-all duration-300 ease-in-out min-h-[280px]"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-400">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon size={24} />
                  </motion.div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
