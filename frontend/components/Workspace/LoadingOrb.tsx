"use client";

import { motion } from "framer-motion";
import type { PhaseState } from "@/lib/types";

export function LoadingOrb({ phase }: { phase: PhaseState }) {
  return (
    <div className="loading-stage">
      <div className="orb-wrap" aria-hidden="true">
        <motion.span
          className="orb-ring ring-one"
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="orb-ring ring-two"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="loading-orb"
          animate={{ scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          <span>{phase.phase || 1}</span>
        </motion.div>
      </div>
      <div className="loading-copy">
        <p>Agent pipeline / phase {phase.phase || 1} of 8</p>
        <h3>{phase.message}</h3>
      </div>
      <div className="progress-track">
        <motion.span animate={{ width: `${phase.progress}%` }} />
      </div>
      <small>{phase.progress}% assembled</small>
    </div>
  );
}

