import { motion, useInView } from "motion/react";
import { BookOpen, HandMetal, Brain, Users, Sparkles } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const STATS = [
  { label: "Interactive Lessons", value: 26, suffix: "+", icon: BookOpen },
  { label: "Signs", value: 500, suffix: "+", icon: HandMetal },
  { label: "Recognition Accuracy", value: 95, suffix: "%", icon: Brain },
  { label: "Future Learners", value: 1000, suffix: "+", icon: Users },
];

const Counter = ({
                   value,
                   suffix = "",
                 }: {
  value: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let current = 0;
    const duration = 2000;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      current += increment;

      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
      <span ref={ref}>
      {count}
        {suffix}
    </span>
  );
};

const Stats = () => {
  return (
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/50 border border-slate-700 backdrop-blur-sm text-cyan-400 text-sm font-medium"
            >
              <Sparkles size={14} />
              <span>Platform</span>
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold tracking-tight text-white"
            >
              Trusted by learners. Powered by AI.
            </motion.h2>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 text-lg"
            >
              Experience a new standard of sign language education,
              leveraging cutting-edge AI to personalize your mastery of
              Tunisian Sign Language.
            </motion.p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, index) => {
              const Icon = stat.icon;

              return (
                  <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className="p-8 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-sm transition-all duration-300 ease-in-out text-center"
                  >
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 text-cyan-400">
                      <Icon size={32} />
                    </div>

                    <div className="text-4xl font-bold text-white mb-2">
                      <Counter
                          value={stat.value}
                          suffix={stat.suffix}
                      />
                    </div>

                    <p className="text-slate-400 text-sm font-medium">
                      {stat.label}
                    </p>
                  </motion.div>
              );
            })}
          </div>
        </div>
      </section>
  );
};

export default Stats;