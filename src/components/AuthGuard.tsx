"use client";
import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useGame } from "@/lib/gameContext";
import Image from "next/image";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, state } = useGame();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Redirect new users to onboarding unless already there
    if (state && !(state.badges as string[])?.includes("onboarded") && path !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [user, isLoading, state, path, router]);

  if (isLoading || !user) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0d1526",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
      }}>
        <Image src="/logo.png" alt="PocketWise" width={48} height={48} style={{ objectFit: "contain" }} />
        <div style={{ color: "#8b9dc3", fontSize: "0.875rem" }}>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
