export type Level = "Beginner" | "Intermediate" | "Advanced";
export type GossipLevel = "EASY" | "INTERMEDIATE" | "HARD";
export type AgentName = "theme_selector" | "scholar" | "stylist" | "critic";
export type AgentStatus = "idle" | "start" | "done";

export interface SynapseOutput {
  themeId: string;
  academicContent: string;
  personalizedTranslation: string;
  aiPersonaFeedback: string;
  nextCheckinQuestion: string;
}

export interface LearnInput {
  topic: string;
  content: string;
  interest: string;
  level: Level;
  chat_history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface PhaseState {
  phase: number;
  message: string;
  progress: number;
}

export interface PipelineState {
  theme_selector: AgentStatus;
  scholar: AgentStatus;
  stylist: AgentStatus;
  critic: AgentStatus;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  accent2: string;
  cardBg: string;
  cardBorder: string;
  headingFont: string;
  bodyFont: string;
  isLight?: boolean;
}

export interface RecallResult {
  result: "correct" | "partial" | "incorrect";
  feedback: string;
  hint: string;
  xp: 0 | 5 | 10;
}

export interface TaggedReply {
  ref_id: number;
  preview: string;
}

export interface GossipMessage {
  id: number;
  role: "sender" | "receiver";
  name: string;
  text: string;
  time: string;
  tagged: TaggedReply | null;
  read: boolean;
  correction: "wrong" | "correct" | "none";
}

export interface StudySession {
  id: string;
  topic: string;
  interest: string;
  level: Level;
  themeId: string;
  xp: number;
  date: string;
  output: SynapseOutput;
  input: LearnInput;
  gossipMessages?: GossipMessage[];
}

