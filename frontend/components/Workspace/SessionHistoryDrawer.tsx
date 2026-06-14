"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Trash2, X } from "lucide-react";
import { clearSessions, removeSession } from "@/lib/sessionStorage";
import { getTheme } from "@/lib/themeEngine";
import type { StudySession } from "@/lib/types";

function getShortTopic(session: StudySession): string {
  const academicTerm = session.output.academicContent.match(/\*\*([^*]+)\*\*/)?.[1];
  const source = session.topic === "Uploaded lesson"
    ? academicTerm || session.input.content
    : session.topic;
  const words = source
    .replace(/[#*_`()[\]{}:;,.!?]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words.slice(0, 2).join(" ") || "Study Topic";
}

export function SessionHistoryDrawer({
  open,
  sessions,
  onClose,
  onLoad,
  onChange,
}: {
  open: boolean;
  sessions: StudySession[];
  onClose: () => void;
  onLoad: (session: StudySession) => void;
  onChange: (sessions: StudySession[]) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            className="drawer-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close history"
          />
          <motion.aside
            className="history-drawer"
            initial={{ x: -340 }}
            animate={{ x: 0 }}
            exit={{ x: -340 }}
            transition={{ type: "spring", stiffness: 370, damping: 38 }}
          >
            <header>
              <span><BookOpen size={18} /> Study history</span>
              <button className="icon-button" onClick={onClose}><X size={17} /></button>
            </header>
            {sessions.length > 0 && (
              <button
                className="clear-history"
                onClick={() => {
                  if (window.confirm("Clear every saved study session?")) {
                    clearSessions();
                    onChange([]);
                  }
                }}
              >
                Clear all sessions
              </button>
            )}
            <div className="session-list">
              {sessions.length === 0 ? (
                <div className="empty-history">
                  <BookOpen size={30} />
                  <strong>No sessions yet</strong>
                  <p>Your generated lessons will be saved here automatically.</p>
                </div>
              ) : sessions.map((session) => {
                const theme = getTheme(session.themeId);
                const shortTopic = getShortTopic(session);
                return (
                  <motion.article
                    layout
                    key={session.id}
                    className="session-card"
                    onClick={() => { onLoad(session); onClose(); }}
                  >
                    <span className="session-swatch" style={{ background: theme.accent }} />
                    <div>
                      <strong>{shortTopic}</strong>
                      <p>{theme.name}</p>
                      <small>{session.level} / {new Date(session.date).toLocaleDateString()}</small>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onChange(removeSession(session.id));
                      }}
                      aria-label="Delete session"
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.article>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
