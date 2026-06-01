
"use client";

import { GameProvider } from "@/lib/gameContext";

import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {

  return <GameProvider>{children}</GameProvider>;

}

