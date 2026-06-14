"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Eye, EyeOff, KeyRound, LoaderCircle, X } from "lucide-react";
import { checkApiKey } from "@/lib/api";

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (key: string) => void;
}

export function ApiKeyModal({ open, onClose, onSaved }: ApiKeyModalProps) {
  const [key, setKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "validating" | "success">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setKey("");
    setError("");
    setStatus("idle");
  }, [open]);

  const save = async () => {
    setStatus("validating");
    setError("");
    try {
      await checkApiKey();
      setStatus("success");
      onSaved(key.trim());
      window.setTimeout(onClose, 550);
    } catch (caught) {
      setStatus("idle");
      setError(caught instanceof Error ? caught.message : "Could not validate the API key.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.section
            className="api-modal"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <button className="icon-button modal-close" onClick={onClose} aria-label="Close">
              <X size={17} />
            </button>
            <div className="modal-icon"><KeyRound size={24} /></div>
            <p className="eyebrow">Private by design</p>
            <h2>Connect Gemini</h2>
            <p className="modal-copy">
              Your key stays in this browser and is sent directly to the local Synapse API.
              It is never written to the server.
            </p>
            <label className="key-field">
              <span>Gemini API key</span>
              <div>
                <input
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  type={visible ? "text" : "password"}
                  placeholder="AIza..."
                  autoFocus
                  onKeyDown={(event) => event.key === "Enter" && save()}
                />
                <button onClick={() => setVisible((current) => !current)} type="button">
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button modal-submit" onClick={save} disabled={status !== "idle"}>
              {status === "validating" && <LoaderCircle className="spin" size={18} />}
              {status === "success" && <Check size={18} />}
              {status === "validating" ? "Validating..." : status === "success" ? "Connected" : "Connect API key"}
            </button>
            <a
              className="text-link"
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
            >
              Get a free key from Google AI Studio <ExternalLink size={13} />
            </a>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

