"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ArrowRight, CheckCircle2, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { gradeRecall } from "@/lib/api";
import type { LearnInput, RecallResult, SynapseOutput } from "@/lib/types";

export function RecallWidget({
  input,
  output,
  onXp,
}: {
  input: LearnInput;
  output: SynapseOutput;
  onXp: (xp: number) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecallResult | null>(null);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setError("");
    try {
      const next = await gradeRecall({
        topic: input.topic || "Uploaded lesson",
        interest: input.interest,
        question: output.nextCheckinQuestion,
        answer,
        academic_content: output.academicContent,
      });
      setResult(next);
      onXp(next.xp);
      if (next.result === "correct") {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { x: 0.72, y: 0.82 },
          colors: ["#ffffff", "#79e1ff", "#9d8cff"],
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not grade that answer.");
    } finally {
      setLoading(false);
    }
  };

  if (!output.nextCheckinQuestion) return null;

  return (
    <motion.section
      className={`recall-widget ${result?.result ?? ""}`}
      initial={{ y: 36, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <div className="recall-heading">
        <span><Sparkles size={14} /> Knowledge check</span>
        {result && <b>+{result.xp} XP</b>}
      </div>
      <p className="recall-question">{output.nextCheckinQuestion}</p>
      <AnimatePresence mode="wait">
        {!result || result.result !== "correct" ? (
          <motion.div key="answer" className="answer-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Explain what would happen..."
              rows={2}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") submit();
              }}
            />
            <button onClick={submit} disabled={loading || !answer.trim()}>
              {loading ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}
            </button>
          </motion.div>
        ) : (
          <motion.div key="mastered" className="mastered-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CheckCircle2 size={18} />
            Concept locked in.
            <button onClick={() => { setResult(null); setAnswer(""); }}>
              <RotateCcw size={13} /> Try another answer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {result && (
        <motion.div className={`recall-feedback ${result.result}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <strong>{result.result === "correct" ? "Spot on." : result.result === "partial" ? "Nearly there." : "Not quite yet."}</strong>
          <span>{result.feedback}</span>
          {result.hint && <small>Hint: {result.hint}</small>}
        </motion.div>
      )}
      {error && <p className="form-error">{error}</p>}
    </motion.section>
  );
}

