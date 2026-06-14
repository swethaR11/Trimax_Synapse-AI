"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkApiKey, generateGossip, streamLesson } from "@/lib/api";
import { loadSessions, loadXp, saveSession, saveXp } from "@/lib/sessionStorage";
import type {
  AgentName,
  GossipLevel,
  GossipMessage,
  LearnInput,
  PhaseState,
  PipelineState,
  StudySession,
  SynapseOutput,
} from "@/lib/types";

const EMPTY_OUTPUT: SynapseOutput = {
  themeId: "slate-tech",
  academicContent: "",
  personalizedTranslation: "",
  aiPersonaFeedback: "",
  nextCheckinQuestion: "",
};

const EMPTY_PIPELINE: PipelineState = {
  theme_selector: "idle",
  scholar: "idle",
  stylist: "idle",
  critic: "idle",
};

export function useSynapse() {
  const [screen, setScreen] = useState<"landing" | "workspace">("landing");
  const [input, setInput] = useState<LearnInput | null>(null);
  const [output, setOutput] = useState<SynapseOutput>(EMPTY_OUTPUT);
  const [pipeline, setPipeline] = useState<PipelineState>(EMPTY_PIPELINE);
  const [phase, setPhase] = useState<PhaseState>({
    phase: 0,
    message: "Preparing your learning space...",
    progress: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKeyError, setApiKeyError] = useState("");
  const [notice, setNotice] = useState("");
  const [gossipMessages, setGossipMessages] = useState<GossipMessage[]>([]);
  const [isGossip, setIsGossip] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [xp, setXp] = useState(0);
  const finalOutputRef = useRef<SynapseOutput>(EMPTY_OUTPUT);

  useEffect(() => {
    setSessions(loadSessions());
    setXp(loadXp());
  }, []);

  const generate = useCallback(async (
    nextInput: LearnInput,
    gossip?: { enabled: boolean; level: GossipLevel },
  ) => {
    // Validate API key before doing anything
    try {
      await checkApiKey();
    } catch (caught) {
      setApiKeyError(caught instanceof Error ? caught.message : "API key error — check backend/.env configuration.");
      return;
    }

    setScreen("workspace");
    setInput(nextInput);
    setOutput(EMPTY_OUTPUT);
    finalOutputRef.current = EMPTY_OUTPUT;
    setPipeline(EMPTY_PIPELINE);
    setPhase({ phase: 1, message: "Analyzing your input...", progress: 2 });
    setError("");
    setNotice("");
    setIsLoading(true);
    setGossipMessages([]);
    setIsGossip(Boolean(gossip?.enabled));

    try {
      const lessonPromise = streamLesson(nextInput, {
        onTheme: (themeId) => {
          setOutput((current) => ({ ...current, themeId }));
          finalOutputRef.current = { ...finalOutputRef.current, themeId };
        },
        onAgent: (agent: AgentName, status) => {
          setPipeline((current) => ({ ...current, [agent]: status }));
        },
        onPhase: setPhase,
        onDelta: (field, text) => {
          setOutput((current) => ({ ...current, [field]: current[field] + text }));
        },
        onResult: (result) => {
          finalOutputRef.current = result;
          setOutput(result);
        },
        onNotice: setNotice,
      });

      const gossipPromise = gossip?.enabled
        ? generateGossip(nextInput.content || nextInput.topic, gossip.level)
        : Promise.resolve([]);
      const [, messages] = await Promise.all([lessonPromise, gossipPromise]);
      setGossipMessages(messages);

      const final = finalOutputRef.current;
      const session: StudySession = {
        id: crypto.randomUUID(),
        topic: nextInput.topic || "Uploaded lesson",
        interest: nextInput.interest,
        level: nextInput.level,
        themeId: final.themeId,
        xp: 0,
        date: new Date().toISOString(),
        input: nextInput,
        output: final,
        gossipMessages: messages.length ? messages : undefined,
      };
      setSessions(saveSession(session));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
      setPhase((current) => ({ ...current, progress: 100 }));
    }
  }, []);

  const addXp = useCallback((amount: number) => {
    setXp((current) => {
      const next = current + amount;
      saveXp(next);
      return next;
    });
  }, []);

  const loadSession = useCallback((session: StudySession) => {
    setInput(session.input);
    setOutput(session.output);
    finalOutputRef.current = session.output;
    setGossipMessages(session.gossipMessages ?? []);
    setIsGossip(Boolean(session.gossipMessages?.length));
    setPipeline({
      theme_selector: "done",
      scholar: "done",
      stylist: "done",
      critic: "done",
    });
    setScreen("workspace");
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setScreen("landing");
    setError("");
    setNotice("");
    setIsLoading(false);
  }, []);

  return {
    screen,
    input,
    output,
    pipeline,
    phase,
    isLoading,
    error,
    setError,
    apiKeyError,
    setApiKeyError,
    notice,
    gossipMessages,
    isGossip,
    sessions,
    setSessions,
    xp,
    addXp,
    generate,
    loadSession,
    reset,
  };
}
