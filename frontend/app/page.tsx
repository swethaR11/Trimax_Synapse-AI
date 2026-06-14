"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LandingScreen } from "@/components/Landing/LandingScreen";
import { AmbientBackground } from "@/components/UI/AmbientBackground";
import { ApiKeyErrorPopup } from "@/components/UI/ApiKeyErrorPopup";
import { useTheme } from "@/components/UI/ThemeProvider";
import { WorkspaceLayout } from "@/components/Workspace/WorkspaceLayout";
import { useSynapse } from "@/hooks/useSynapse";

export default function HomePage() {
  const synapse = useSynapse();
  const { setThemeId } = useTheme();

  useEffect(() => {
    if (synapse.output.themeId) setThemeId(synapse.output.themeId);
  }, [setThemeId, synapse.output.themeId]);

  return (
    <>
      <AmbientBackground />
      <AnimatePresence mode="wait">
        {synapse.screen === "landing" || !synapse.input ? (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LandingScreen
              onGenerate={synapse.generate}
              error={synapse.error}
              clearError={() => synapse.setError("")}
              sessions={synapse.sessions}
              setSessions={synapse.setSessions}
              loadSession={synapse.loadSession}
            />
          </motion.div>
        ) : (
          <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WorkspaceLayout
              input={synapse.input}
              output={synapse.output}
              pipeline={synapse.pipeline}
              phase={synapse.phase}
              isLoading={synapse.isLoading}
              error={synapse.error}
              notice={synapse.notice}
              gossipMessages={synapse.gossipMessages}
              isGossip={synapse.isGossip}
              sessions={synapse.sessions}
              setSessions={synapse.setSessions}
              xp={synapse.xp}
              addXp={synapse.addXp}
              loadSession={synapse.loadSession}
              onBack={synapse.reset}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Key Error Popup — shown on top of any screen */}
      <ApiKeyErrorPopup
        message={synapse.apiKeyError}
        onDismiss={() => synapse.setApiKeyError("")}
      />
    </>
  );
}
