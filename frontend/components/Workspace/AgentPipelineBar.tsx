"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { AgentName, PipelineState } from "@/lib/types";

const STEPS: Array<{ id: AgentName; label: string; short: string }> = [
  { id: "theme_selector", label: "Theme Selector", short: "Theme" },
  { id: "scholar", label: "Scholar Agent", short: "Scholar" },
  { id: "stylist", label: "Stylist Agent", short: "Stylist" },
  { id: "critic", label: "Critic Agent", short: "Critic" },
];

export function AgentPipelineBar({
  pipeline,
  active,
}: {
  pipeline: PipelineState;
  active: boolean;
}) {
  const [elapsed, setElapsed] = useState<Record<AgentName, number>>({
    theme_selector: 0,
    scholar: 0,
    stylist: 0,
    critic: 0,
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsed((current) => {
        const next = { ...current };
        for (const step of STEPS) {
          if (pipeline[step.id] === "start") next[step.id] += 0.1;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [pipeline]);

  return (
    <motion.div
      className={`pipeline-bar ${active ? "active" : ""}`}
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      {STEPS.map((step, index) => {
        const status = pipeline[step.id];
        return (
          <div className="pipeline-segment" key={step.id}>
            <div className={`pipeline-step ${status}`}>
              <span className="step-node">
                {status === "done" ? <Check size={12} /> : index + 1}
              </span>
              <span className="step-label">
                <b>{step.label}</b>
                <small>
                  {status === "start" ? `${elapsed[step.id].toFixed(1)}s` : status === "done" ? "done" : "waiting"}
                </small>
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span className={`pipeline-connector ${status === "done" ? "filled" : ""}`} />
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

