"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Download, X } from "lucide-react";
import { getTheme } from "@/lib/themeEngine";
import type { LearnInput, SynapseOutput } from "@/lib/types";

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = `${line}${word} `;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line.trim());
      line = `${word} `;
    } else {
      line = test;
    }
    if (lines.length === 5) break;
  }
  if (line && lines.length < 6) lines.push(line.trim());
  return lines;
}

export function ShareCardModal({
  open,
  input,
  output,
  onClose,
}: {
  open: boolean;
  input: LearnInput;
  output: SynapseOutput;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const theme = getTheme(output.themeId);
    canvas.width = 1200;
    canvas.height = 630;
    context.fillStyle = theme.bg;
    context.fillRect(0, 0, 1200, 630);

    const gradient = context.createRadialGradient(980, 80, 20, 980, 80, 500);
    gradient.addColorStop(0, `${theme.accent}55`);
    gradient.addColorStop(1, "transparent");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 630);

    context.fillStyle = theme.fg;
    context.font = "700 27px Arial";
    context.fillText("SYNAPSE AI", 72, 72);
    context.fillStyle = theme.accent;
    context.font = "600 17px Arial";
    context.fillText(theme.name.toUpperCase(), 945, 70);

    context.fillStyle = "rgba(255,255,255,.07)";
    context.strokeStyle = theme.cardBorder;
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(70, 118, 1060, 132, 24);
    context.fill();
    context.stroke();
    context.fillStyle = theme.fg;
    context.font = "700 38px Arial";
    context.fillText(input.topic || "Uploaded lesson", 105, 170);
    context.fillStyle = theme.accent;
    context.font = "500 21px Arial";
    context.fillText(`through ${input.interest}`, 105, 214);

    context.fillStyle = theme.fg;
    context.font = "500 27px Arial";
    const lines = wrapText(context, output.personalizedTranslation, 990);
    lines.forEach((line, index) => context.fillText(line, 90, 315 + index * 43));
    context.fillStyle = theme.muted;
    context.font = "500 18px Arial";
    context.fillText(`${input.level} / Arc Night 2026 / Translate the abstract`, 72, 580);
  }, [input, open, output]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = `synapse-${(input.topic || "lesson").toLowerCase().replace(/\W+/g, "-")}.png`;
    anchor.click();
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1800);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section
            className="share-modal"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <header>
              <div><small>EXPORT</small><h2>Share your new mental model</h2></div>
              <button className="icon-button" onClick={onClose}><X size={17} /></button>
            </header>
            <canvas ref={canvasRef} />
            <p>1200 x 630 social card, generated locally from this lesson.</p>
            <button className="primary-button" onClick={download}>
              {downloaded ? <Check size={17} /> : <Download size={17} />}
              {downloaded ? "Downloaded" : "Download PNG"}
            </button>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

