"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  History,
  MessageSquareText,
  Minus,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/components/UI/ThemeProvider";
import { KeyboardShortcuts } from "@/components/UI/KeyboardShortcuts";
import { AgentPipelineBar } from "@/components/Workspace/AgentPipelineBar";
import { GossipChatUI } from "@/components/Workspace/GossipChatUI";
import { LoadingOrb } from "@/components/Workspace/LoadingOrb";
import { RecallWidget } from "@/components/Workspace/RecallWidget";
import { SessionHistoryDrawer } from "@/components/Workspace/SessionHistoryDrawer";
import { ShareCardModal } from "@/components/Workspace/ShareCardModal";
import { SkeletonPanel } from "@/components/Workspace/SkeletonPanel";
import type {
  GossipMessage,
  LearnInput,
  PhaseState,
  PipelineState,
  StudySession,
  SynapseOutput,
} from "@/lib/types";

function RichText({ text }: { text: string }) {
  const lines = text.split("\n").filter((line, index, all) => line.trim() || all[index - 1]?.trim());
  return (
    <div className="rich-text">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        const isBullet = /^[-*•]\s/.test(trimmed);
        const parts = trimmed.replace(/^[-*•]\s/, "").split(/(\*\*[^*]+\*\*)/g);
        const content = parts.map((part, partIndex) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={partIndex}>{part.slice(2, -2)}</strong>
            : part,
        );
        return isBullet ? <p className="bullet" key={index}>{content}</p> : <p key={index}>{content}</p>;
      })}
    </div>
  );
}

function XpRing({ xp }: { xp: number }) {
  const progress = xp % 100;
  const circumference = 2 * Math.PI * 19;
  return (
    <div className="xp-ring" title={`${xp} total XP`}>
      <svg viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="19" className="xp-track" />
        <circle
          cx="24"
          cy="24"
          r="19"
          className="xp-progress"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
        />
      </svg>
      <span>{xp}</span>
    </div>
  );
}

export function WorkspaceLayout({
  input,
  output,
  pipeline,
  phase,
  isLoading,
  error,
  notice,
  gossipMessages,
  isGossip,
  sessions,
  setSessions,
  xp,
  addXp,
  loadSession,
  onBack,
}: {
  input: LearnInput;
  output: SynapseOutput;
  pipeline: PipelineState;
  phase: PhaseState;
  isLoading: boolean;
  error: string;
  notice: string;
  gossipMessages: GossipMessage[];
  isGossip: boolean;
  sessions: StudySession[];
  setSessions: (sessions: StudySession[]) => void;
  xp: number;
  addXp: (xp: number) => void;
  loadSession: (session: StudySession) => void;
  onBack: () => void;
}) {
  const { theme, setThemeId } = useTheme();
  const [leftWidth, setLeftWidth] = useState(50);
  const [fontSize, setFontSize] = useState(16);
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const panelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (output.themeId) setThemeId(output.themeId);
  }, [output.themeId, setThemeId]);

  const share = useCallback(() => {
    if (output.personalizedTranslation) setShareOpen(true);
  }, [output.personalizedTranslation]);
  const history = useCallback(() => setHistoryOpen(true), []);
  const key = useCallback(() => {}, []);

  const startResize = (event: React.PointerEvent) => {
    const container = panelsRef.current;
    if (!container) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      const width = ((moveEvent.clientX - bounds.left) / bounds.width) * 100;
      setLeftWidth(Math.min(72, Math.max(28, width)));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const copyAcademic = async () => {
    await navigator.clipboard.writeText(output.academicContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <main className="workspace-shell">
      <header className="topbar workspace-topbar">
        <div className="workspace-left-actions">
          <button className="icon-button" onClick={onBack} aria-label="Back to landing"><ArrowLeft size={18} /></button>
          <div className="wordmark compact">
            <span className="neural-mark"><i /><i /><i /></span>
            <span>synapse</span><small>AI</small>
          </div>
          <span className="workspace-topic">{input.topic || "Uploaded lesson"}</span>
        </div>
        <div className="header-actions">
          <span className="active-theme-chip"><i style={{ background: theme.accent }} />{theme.name}</span>
          <button className="header-action" onClick={share}><Share2 size={15} /> Share</button>
          <button className="header-action" onClick={history}><History size={15} /> History</button>
          <XpRing xp={xp} />
          <KeyboardShortcuts onShare={share} onHistory={history} onKey={key} onBack={onBack} />
        </div>
      </header>

      <AgentPipelineBar pipeline={pipeline} active={isLoading} />

      <div className="workspace-panels" ref={panelsRef}>
        <motion.section
          className="learning-panel academic-panel"
          style={{ width: `${leftWidth}%`, "--panel-font-size": `${fontSize}px` } as React.CSSProperties}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <header className="panel-header">
            <div><span className="panel-icon"><BookOpen size={16} /></span><div><small>SCHOLAR AGENT</small><strong>Academic definition</strong></div></div>
            <div className="panel-actions">
              <button onClick={() => setFontSize((size) => Math.max(13, size - 1))} aria-label="Decrease text size"><Minus size={14} /></button>
              <button onClick={() => setFontSize((size) => Math.min(20, size + 1))} aria-label="Increase text size"><Plus size={14} /></button>
              <button onClick={copyAcademic} disabled={!output.academicContent}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </header>
          <div className="panel-content academic-content">
            {!output.academicContent ? (
              <>
                <LoadingOrb phase={phase} />
                <SkeletonPanel />
              </>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="source-kicker">Rigorous source / {input.level}</div>
                <RichText text={output.academicContent} />
                {isLoading && <span className="stream-cursor" />}
              </motion.div>
            )}
          </div>
        </motion.section>

        <div
          className="resize-handle"
          onPointerDown={startResize}
          onDoubleClick={() => setLeftWidth(50)}
          role="separator"
          aria-label="Resize panels"
        ><span /></div>

        <motion.section
          className={`learning-panel analogy-panel ${isGossip ? "gossip-active" : ""}`}
          style={{ width: `${100 - leftWidth}%` }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
        >
          <header className="panel-header">
            <div>
              <span className="panel-icon">{isGossip ? <MessageSquareText size={16} /> : <Sparkles size={16} />}</span>
              <div><small>{isGossip ? "GOSSIP MODE" : "STYLIST AGENT"}</small><strong>{isGossip ? "The group chat" : `${theme.name} translation`}</strong></div>
            </div>
            <span className="theme-mini">{theme.emoji} {input.interest}</span>
          </header>
          <div className="panel-content analogy-content">
            {isGossip ? (
              gossipMessages.length ? <GossipChatUI messages={gossipMessages} /> : (
                <div className="gossip-loading"><SkeletonPanel chat /><SkeletonPanel chat /><p>Spilling the educational tea...</p></div>
              )
            ) : !output.personalizedTranslation ? (
              <div className="analogy-loading">
                <SkeletonPanel chat />
                <SkeletonPanel chat />
                <SkeletonPanel chat />
              </div>
            ) : (
              <div className="tutor-thread">
                <motion.article className="tutor-message" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <span className="tutor-avatar">{theme.emoji}</span>
                  <div>
                    <RichText text={output.personalizedTranslation} />
                    <small>Stylist Agent / translated through {input.interest}</small>
                  </div>
                </motion.article>
                {output.aiPersonaFeedback && (
                  <motion.article className="persona-note" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Sparkles size={15} />
                    <p>{output.aiPersonaFeedback}</p>
                  </motion.article>
                )}
                {!isLoading && <RecallWidget input={input} output={output} onXp={addXp} />}
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {notice && !error && (
          <motion.div className="notice-toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <strong>Local fallback active</strong>
            <span>{notice}</span>
          </motion.div>
        )}
        {error && (
          <motion.div className="error-toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <strong>Generation paused</strong>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <SessionHistoryDrawer
        open={historyOpen}
        sessions={sessions}
        onClose={() => setHistoryOpen(false)}
        onLoad={loadSession}
        onChange={setSessions}
      />
      <ShareCardModal open={shareOpen} input={input} output={output} onClose={() => setShareOpen(false)} />
    </main>
  );
}
