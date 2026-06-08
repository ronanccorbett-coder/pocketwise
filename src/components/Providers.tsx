"use client";
import { GameProvider } from "@/lib/gameContext";
import { ThemeProvider } from "@/lib/theme";
import { ReactNode, useState, useEffect } from "react";
import EventOverlay from "./EventOverlay";
import { ToastContainer } from "./Toast";
import { CornerCelebration } from "./Mascot";

export default function Providers({ children }: { children: ReactNode }) {
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    const onModule = () => setCelebration("Module complete! Ka rawe!");
    window.addEventListener("pw:module-complete", onModule);
    return () => window.removeEventListener("pw:module-complete", onModule);
  }, []);

  return (
    <ThemeProvider>
      <GameProvider>
        <ToastContainer />
        <EventOverlay />
        {celebration && (
          <CornerCelebration message={celebration} onDone={() => setCelebration(null)} />
        )}
        {children}
      </GameProvider>
    </ThemeProvider>
  );
}
