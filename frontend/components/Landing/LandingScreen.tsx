"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Check,
  FileText,
  HelpCircle,
  History,
  LoaderCircle,
  MessageCircleMore,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useTheme } from "@/components/UI/ThemeProvider";
import { SessionHistoryDrawer } from "@/components/Workspace/SessionHistoryDrawer";
import { previewTheme, uploadDocument } from "@/lib/api";
import type { GossipLevel, LearnInput, Level, StudySession } from "@/lib/types";

interface LandingScreenProps {
  onGenerate: (
    input: LearnInput,
    gossip?: { enabled: boolean; level: GossipLevel },
  ) => Promise<void>;
  error: string;
  clearError: () => void;
  sessions: StudySession[];
  setSessions: (sessions: StudySession[]) => void;
  loadSession: (session: StudySession) => void;
}

const INTERESTS = [
  "fashion", "cricket", "anime", "coffee", "chess", "jazz", "gaming",
  "yoga", "k-drama", "coding", "bollywood", "space", "cinema", "formula 1",
];

// Maps the main level to a GossipLevel without showing sub-pills
function toGossipLevel(level: Level): GossipLevel {
  if (level === "Intermediate") return "INTERMEDIATE";
  if (level === "Advanced") return "HARD";
  return "EASY";
}

export function LandingScreen({
  onGenerate,
  error,
  clearError,
  sessions,
  setSessions,
  loadSession,
}: LandingScreenProps) {
  const { setThemeId } = useTheme();
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [interest, setInterest] = useState("");
  const [level, setLevel] = useState<Level>("Beginner");
  const [gossipMode, setGossipMode] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [formError, setFormError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Silently switch the app theme when the user types an interest — no badge shown
  useEffect(() => {
    if (interest.trim().length < 2) return;
    const timeout = window.setTimeout(async () => {
      try {
        const nextThemeId = await previewTheme(interest.trim());
        setThemeId(nextThemeId);
      } catch {
        // silently ignore — UI stays on current theme
      }
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [interest, setThemeId]);

  const processFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setFormError("");
    try {
      const uploaded = await uploadDocument(file);
      setContent(uploaded.text);
      setUploadName(uploaded.filename);
      setShowPaste(false);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    clearError();
    setFormError("");
    if (!topic.trim() && !content.trim()) {
      setFormError("Add a topic, paste notes, or upload a document.");
      return;
    }
    if (!interest.trim()) {
      setFormError("Tell Synapse what you are passionate about.");
      return;
    }
    // Gossip level auto-derived from selected main level — no user choice needed
    const gossipLevel = toGossipLevel(level);
    await onGenerate(
      {
        topic: topic.trim(),
        content: content.trim(),
        interest: interest.trim(),
        level,
        chat_history: [],
      },
      { enabled: gossipMode, level: gossipLevel },
    );
  };

  return (
    <main className="landing-shell">
      <header className="topbar landing-topbar">
        <div className="wordmark">
          <span className="neural-mark" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span>synapse</span>
          <small>AI</small>
        </div>
        <div className="header-actions">
          <button
            className="header-action"
            onClick={() => setHistoryOpen(true)}
            aria-label="View study history"
          >
            <History size={15} /> History
          </button>
          <button className="icon-button" aria-label="Help" title="Choose a topic, interest, and level.">
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      <section className="hero">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="eyebrow hero-eyebrow"
        >
          <Sparkles size={13} /> Arc Night 2026 / EdTech
        </motion.div>
        <h1 aria-label="Translate the abstract. Personalize the path.">
          {["Translate", "the", "abstract."].map((word, index) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.07 }}
            >
              {word}{" "}
            </motion.span>
          ))}
          <br />
          {["Personalize", "the", "path."].map((word, index) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.07 }}
            >
              {word}{" "}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="hero-copy"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
        >
          Turn any dense concept into a mental model built from the world you already love.
        </motion.p>

        <motion.div
          className="input-grid"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
        >
          <article className="entry-card">
            <div className="card-title-row">
              <span className="card-icon"><MessageCircleMore size={21} /></span>
              <div>
                <h2>Explore a topic</h2>
                <p>Start with a concept you want to finally understand.</p>
              </div>
            </div>
            <label className="main-input">
              <BookOpenText size={17} />
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. JVM garbage collection"
                onKeyDown={(event) => event.key === "Enter" && submit()}
              />
            </label>
            <div className="suggestion-row">
              {["Recursion", "Quantum entanglement", "HTTP"].map((item) => (
                <button key={item} onClick={() => setTopic(item)}>{item}</button>
              ))}
            </div>
          </article>

          <article className={`entry-card ${dragging ? "dragging" : ""}`}>
            <div className="card-title-row">
              <span className="card-icon"><FileText size={21} /></span>
              <div>
                <h2>Bring your own material</h2>
                <p>Upload a chapter or paste lecture notes.</p>
              </div>
            </div>
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(event) => processFile(event.target.files?.[0])}
            />
            <button
              className="dropzone"
              onClick={() => fileInput.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                processFile(event.dataTransfer.files[0]);
              }}
            >
              {uploading ? <LoaderCircle className="spin" size={22} /> : uploadName ? <Check size={22} /> : <UploadCloud size={22} />}
              <span>{uploading ? "Extracting text..." : uploadName || "Drop PDF here or browse"}</span>
              <small>PDF, TXT or MD / up to 12 MB</small>
            </button>
            <button className="paste-toggle" onClick={() => setShowPaste((current) => !current)}>
              {showPaste ? "Hide pasted text" : "Or paste text instead"} <ArrowRight size={13} />
            </button>
          </article>
        </motion.div>

        <AnimatePresence>
          {showPaste && (
            <motion.textarea
              className="paste-area"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 112, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste the chapter, lecture notes, or passage here..."
            />
          )}
        </AnimatePresence>

        <motion.div
          className="configuration-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72 }}
        >
          <div className="interest-wrap">
            <label>
              <span>Your world</span>
              <input
                value={interest}
                onChange={(event) => setInterest(event.target.value)}
                placeholder="What are you obsessed with? Fashion, cricket, anime..."
              />
            </label>
          </div>

          {/* All 4 mode options sit as equal peers — level is single-select, gossip is an independent toggle */}
          <div className="mode-row mode-row-unified">
            {(["Beginner", "Intermediate", "Advanced"] as Level[]).map((item) => (
              <button
                key={item}
                className={`level-pill ${level === item ? "selected" : ""}`}
                onClick={() => setLevel(item)}
              >
                {item}
              </button>
            ))}
            <span className="mode-divider" />
            <button
              className={`gossip-toggle ${gossipMode ? "selected" : ""}`}
              onClick={() => setGossipMode((current) => !current)}
            >
              <MessageCircleMore size={15} />
              Gossip
            </button>
          </div>

          <button className="generate-button" onClick={submit}>
            <Sparkles size={18} />
            Build my translation
            <ArrowRight size={18} />
          </button>
        </motion.div>

        {(formError || error) && <p className="landing-error">{formError || error}</p>}
      </section>

      <div className="ticker" aria-hidden="true">
        <div>
          {[...INTERESTS, ...INTERESTS].map((item, index) => (
            <span key={`${item}-${index}`}>{item}<b>·</b></span>
          ))}
        </div>
      </div>

      <SessionHistoryDrawer
        open={historyOpen}
        sessions={sessions}
        onClose={() => setHistoryOpen(false)}
        onLoad={(session) => { loadSession(session); setHistoryOpen(false); }}
        onChange={setSessions}
      />
    </main>
  );
}
