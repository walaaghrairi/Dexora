import { motion } from 'motion/react';
import { Sparkles, BrainCircuit, Globe2, Target } from 'lucide-react';

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'Accessible AI',
    description: 'Learn sign language anytime, anywhere with 24/7 AI-driven feedback.',
  },
  {
    icon: Globe2,
    title: 'Cultural Precision',
    description: 'Deeply specialized in the nuances of Tunisian Sign Language (TSL).',
  },
  {
    icon: Target,
    title: 'Personalized Pace',
    description: 'Adaptive learning paths that evolve with your skill level.',
  },
];

const About = () => {
  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Visual Side */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-square rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />
              <BrainCircuit size={128} className="text-cyan-400 opacity-80" />
            </div>
            {/* Decorative element */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -right-10 p-6 rounded-2xl bg-slate-900 border border-slate-700 backdrop-blur-md shadow-2xl"
            >
              <p className="text-cyan-400 font-bold text-lg">AI-Driven</p>
              <p className="text-slate-400 text-sm">Learning Innovation</p>
            </motion.div>
          </motion.div>

          {/* Content Side */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700 backdrop-blur-sm text-cyan-400 text-sm font-medium"
            >
              <Sparkles size={14} /> Why Dexora
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-white tracking-tight"
            >
              Redefining Sign Language Education
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg leading-relaxed"
            >
              Dexora bridges the communication gap through technology. By merging 
              advanced AI recognition with cultural insights from Tunisian Sign 
              Language, we make learning accessible, engaging, and accurate for everyone.
            </motion.p>

            <div className="space-y-6">
              {FEATURES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div 
                    key={item.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                    className="flex gap-4"
                  >
                    <div className="mt-1 w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
