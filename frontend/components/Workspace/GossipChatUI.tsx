"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, MoreVertical, Send } from "lucide-react";
import { gossipReply } from "@/lib/api";
import type { GossipMessage } from "@/lib/types";

const SITE_NAME = "Synapse";

function formatNow(): string {
  const now = new Date();
  const hour = now.getHours() % 12 || 12;
  const min = now.getMinutes().toString().padStart(2, "0");
  const ampm = now.getHours() < 12 ? "AM" : "PM";
  return `${hour}:${min} ${ampm}`;
}

export function GossipChatUI({ messages: initialMessages }: { messages: GossipMessage[] }) {
  const [messages, setMessages] = useState<GossipMessage[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when initialMessages change (new session)
  useEffect(() => {
    setMessages(initialMessages);
    setVisibleCount(0);
  }, [initialMessages]);

  // Reveal initial AI messages one by one with animation
  useEffect(() => {
    if (visibleCount >= messages.length || isReplying) return;
    // Only auto-advance for the initial batch (messages that existed from the start)
    if (visibleCount >= initialMessages.length) return;
    const interval = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= initialMessages.length) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 520);
    return () => window.clearInterval(interval);
  }, [messages.length, visibleCount, isReplying, initialMessages.length]);

  // Scroll to bottom when new messages appear
  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [visibleCount, isTyping]);

  const receiverName = useMemo(() => {
    for (const msg of initialMessages) {
      if (msg.role === "receiver") return msg.name;
    }
    return SITE_NAME;
  }, [initialMessages]);

  const nextMessage = messages[visibleCount];
  const showTypingBubble = (nextMessage && !isReplying) || isTyping;
  const typingRole = isTyping ? "receiver" : nextMessage?.role;

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isReplying) return;
    setInputText("");

    // Optimistically add user message
    const userMsg: GossipMessage = {
      id: messages.length + 1,
      role: "sender",
      name: "You",
      text,
      time: formatNow(),
      tagged: null,
      read: true,
      correction: "none",
    };

    setMessages((prev) => [...prev, userMsg]);
    setVisibleCount((prev) => Math.max(prev, messages.length) + 1);

    // Show typing indicator
    setIsTyping(true);
    setIsReplying(true);

    try {
      const reply = await gossipReply(
        messages, // send history BEFORE user message for context
        text,
        messages.length + 2, // next ID after user message
      );
      // Ensure the reply has the receiver name from existing conversation
      const replyWithName: GossipMessage = { ...reply, name: receiverName };
      setMessages((prev) => [...prev, replyWithName]);
      setVisibleCount((prev) => prev + 1);
    } catch {
      // Fallback message on error
      const fallback: GossipMessage = {
        id: messages.length + 2,
        role: "receiver",
        name: receiverName,
        text: "bestie the connection dropped 😭 say that again?",
        time: formatNow(),
        tagged: null,
        read: false,
        correction: "none",
      };
      setMessages((prev) => [...prev, fallback]);
      setVisibleCount((prev) => prev + 1);
    } finally {
      setIsTyping(false);
      setIsReplying(false);
    }
  };

  return (
    <div className="whatsapp-shell">
      <div className="whatsapp-header">
        <ChevronLeft size={21} />
        <span className="whatsapp-avatar">{receiverName.charAt(0).toUpperCase()}</span>
        <div>
          <strong>{receiverName}</strong>
          <small>online / gossiping rn</small>
        </div>
        <MoreVertical size={20} className="wa-menu" />
      </div>

      <div className="whatsapp-chat" ref={viewportRef}>
        <div className="date-chip">TODAY</div>
        <AnimatePresence>
          {messages.slice(0, visibleCount).map((message) => {
            const isUser = message.role === "sender";
            const reaction = /^[\p{Emoji}\s\u200d]+$/u.test(message.text) && message.text.length < 20;
            return (
              <motion.div
                key={message.id}
                className={`wa-message ${message.role} ${reaction ? "reaction" : ""} ${message.correction}`}
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
              >
                {/* Sender label — show contact name for left-side messages */}
                {!isUser && (
                  <span className="wa-sender-label">{message.name}</span>
                )}
                {message.tagged && (
                  <div className="tagged-reply">
                    <strong>Replying to message {message.tagged.ref_id}</strong>
                    <span>{message.tagged.preview}</span>
                  </div>
                )}
                <p>{message.text}</p>
                <span className="wa-meta">
                  {message.time}
                  {message.role === "sender" && (
                    <i className={message.read ? "read" : ""}>{message.read ? "✓✓" : "✓"}</i>
                  )}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {showTypingBubble && (
            <motion.div
              key="typing"
              className={`typing-bubble ${typingRole ?? "receiver"}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <i /><i /><i />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive input bar */}
      <div className="whatsapp-input-bar">
        <input
          ref={inputRef}
          className="wa-text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          disabled={isReplying}
          aria-label="Chat message input"
        />
        <button
          className={`wa-send-btn ${isReplying ? "disabled" : ""}`}
          onClick={sendMessage}
          disabled={isReplying || !inputText.trim()}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
