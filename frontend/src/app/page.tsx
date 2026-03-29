"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LandingHero from "@/components/LandingHero";
import XrayApp from "@/components/XrayApp";
import FloatingChat from "@/components/FloatingChat";

export default function Home() {
  const [started, setStarted] = useState(false);

  return (
    <>
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
          >
            <LandingHero onStart={() => setStarted(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="h-screen"
          >
            <XrayApp onBack={() => setStarted(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating chatbot — always present when app is open */}
      <AnimatePresence>
        {started && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <FloatingChat />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
