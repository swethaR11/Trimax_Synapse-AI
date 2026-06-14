import type {
  AgentName,
  GossipLevel,
  GossipMessage,
  LearnInput,
  RecallResult,
  SynapseOutput,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch (caught) {
    if (caught instanceof TypeError) {
      throw new Error(
        `Cannot reach the Synapse backend at ${API_URL}. Make sure start-backend.ps1 is running.`,
      );
    }
    throw caught;
  }
}

async function errorFrom(response: Response): Promise<Error> {
  try {
    const payload = await response.json();
    return new Error(payload.detail ?? payload.message ?? "Request failed.");
  } catch {
    return new Error(`Request failed with status ${response.status}.`);
  }
}

/** Check that the backend API key is configured and valid. Throws on failure. */
export async function checkApiKey(): Promise<void> {
  const response = await fetchApi("/api/validate-key", { method: "POST" });
  if (!response.ok) throw await errorFrom(response);
}

export async function previewTheme(interest: string): Promise<string> {
  const response = await fetchApi("/api/preview-theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interest }),
  });
  if (!response.ok) throw await errorFrom(response);
  const data = await response.json();
  return data.themeId;
}

export async function uploadDocument(file: File): Promise<{ text: string; filename: string }> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetchApi("/api/upload-pdf", {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw await errorFrom(response);
  return response.json();
}

type StreamHandlers = {
  onTheme: (themeId: string) => void;
  onAgent: (agent: AgentName, status: "start" | "done") => void;
  onPhase: (phase: { phase: number; message: string; progress: number }) => void;
  onDelta: (field: keyof SynapseOutput, text: string) => void;
  onResult: (output: SynapseOutput) => void;
  onNotice: (message: string) => void;
};

export async function streamLesson(
  input: LearnInput,
  handlers: StreamHandlers,
): Promise<void> {
  const response = await fetchApi("/api/learn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await errorFrom(response);
  if (!response.body) throw new Error("The browser did not expose the response stream.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const dispatch = (block: string) => {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
    if (!data.length) return;
    const payload = JSON.parse(data.join("\n"));
    if (event === "theme") handlers.onTheme(payload.themeId);
    if (event === "agent_status") handlers.onAgent(payload.agent, payload.status);
    if (event === "phase") handlers.onPhase(payload);
    if (event === "field_delta") handlers.onDelta(payload.field, payload.text);
    if (event === "result") handlers.onResult(payload);
    if (event === "notice") handlers.onNotice(payload.message);
    if (event === "error") throw new Error(payload.message);
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      dispatch(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
    if (done) break;
  }
  if (buffer.trim()) dispatch(buffer);
}

export async function gradeRecall(
  payload: {
    topic: string;
    interest: string;
    question: string;
    answer: string;
    academic_content: string;
  },
): Promise<RecallResult> {
  const response = await fetchApi("/api/recall", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await errorFrom(response);
  return response.json();
}

export async function generateGossip(
  content: string,
  gossipLevel: GossipLevel,
): Promise<GossipMessage[]> {
  const response = await fetchApi("/api/gossip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, gossip_level: gossipLevel }),
  });
  if (!response.ok) throw await errorFrom(response);
  const payload = await response.json();
  return payload.messages;
}

export async function gossipReply(
  history: GossipMessage[],
  userText: string,
  nextId: number,
): Promise<GossipMessage> {
  const response = await fetchApi("/api/gossip-reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, user_text: userText, next_id: nextId }),
  });
  if (!response.ok) throw await errorFrom(response);
  const payload = await response.json();
  return payload.message;
}
