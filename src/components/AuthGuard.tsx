"use client";
import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/gameContext";
import Image from "next/image";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
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

  if (!user) return null;
  return <>{children}</>;
}
