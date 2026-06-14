"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Command, History, KeyRound, Search, Share2, X } from "lucide-react";

interface CommandItem {
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  action: () => void;
}

export function KeyboardShortcuts({
  onShare,
  onHistory,
  onKey,
  onBack,
}: {
  onShare: () => void;
  onHistory: () => void;
  onKey: () => void;
  onBack: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const commands = useMemo<CommandItem[]>(() => [
    { label: "Share this lesson", shortcut: "Ctrl S", icon: <Share2 size={16} />, action: onShare },
    { label: "Open study history", shortcut: "Ctrl H", icon: <History size={16} />, action: onHistory },
    { label: "Change Gemini key", shortcut: "Ctrl Shift K", icon: <KeyRound size={16} />, action: onKey },
    { label: "Return to landing", shortcut: "Ctrl Backspace", icon: <ArrowLeft size={16} />, action: onBack },
  ], [onBack, onHistory, onKey, onShare]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "k" && !event.shiftKey) {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        onShare();
      }
      if (modifier && event.key.toLowerCase() === "h") {
        event.preventDefault();
        onHistory();
      }
      if (modifier && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onKey();
      }
      if (modifier && event.key === "Backspace") {
        event.preventDefault();
        onBack();
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack, onHistory, onKey, onShare]);

  const filtered = commands.filter((command) =>
    command.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <button className="shortcut-hint" onClick={() => setOpen(true)}>
        <Command size={13} /> K
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="modal-backdrop palette-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section className="command-palette" initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <div className="palette-search">
                <Search size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a command..." autoFocus />
                <button onClick={() => setOpen(false)}><X size={16} /></button>
              </div>
              <div className="command-list">
                {filtered.map((command) => (
                  <button
                    key={command.label}
                    onClick={() => {
                      command.action();
                      setOpen(false);
                    }}
                  >
                    <span>{command.icon}{command.label}</span>
                    <kbd>{command.shortcut}</kbd>
                  </button>
                ))}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

