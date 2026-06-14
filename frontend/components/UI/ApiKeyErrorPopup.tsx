"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ApiKeyErrorPopupProps {
  message: string;
  onDismiss: () => void;
}

export function ApiKeyErrorPopup({ message, onDismiss }: ApiKeyErrorPopupProps) {
  return (
    <AnimatePresence>
      {message && (
        <>
          {/* Backdrop */}
          <motion.div
            className="api-error-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />
          {/* Popup */}
          <motion.div
            className="api-error-popup"
            initial={{ opacity: 0, scale: 0.88, y: -24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -16 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            role="alertdialog"
            aria-modal="true"
            aria-label="API Key Error"
          >
            <div className="api-error-icon">
              <AlertTriangle size={28} />
            </div>
            <div className="api-error-body">
              <strong className="api-error-title">🔑 API Key Error</strong>
              <p className="api-error-message">{message}</p>
              <p className="api-error-hint">
                Add <code>GEMINI_API_KEY=your_key</code> to{" "}
                <code>backend/.env</code> and restart the backend server.
              </p>
            </div>
            <button
              className="api-error-close"
              onClick={onDismiss}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
