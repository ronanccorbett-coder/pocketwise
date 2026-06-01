import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/gameContext";

export const metadata: Metadata = {
  title: "PocketWise — Financial Literacy for NZ Students",
  description: "Gamified financial education platform for New Zealand students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
