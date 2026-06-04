"use client";
import { GameProvider } from "@/lib/gameContext";
import { ReactNode } from "react";
import EventOverlay from "./EventOverlay";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <GameProvider>
      <EventOverlay />
      {children}
    </GameProvider>
  );
}
