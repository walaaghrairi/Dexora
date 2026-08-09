import { Link } from "react-router-dom";
import { motion } from "motion/react";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">

            {/* Hero */}
            <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">

                <motion.h1
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-7xl font-black tracking-wide"
                >
                    DEXORA
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: .4 }}
                    className="mt-6 max-w-2xl text-xl text-slate-300"
                >
                    Learn Tunisian Sign Language with Artificial Intelligence.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: .8 }}
                    className="mt-10"
                >
                    <Link
                        to="/login"
                        className="rounded-xl bg-cyan-500 px-8 py-4 text-lg font-semibold transition hover:bg-cyan-400 hover:scale-105"
                    >
                        Get Started →
                    </Link>
                </motion.div>

            </section>

        </div>
    );
}