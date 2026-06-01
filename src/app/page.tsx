"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/landing");
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", background: "#0d1526",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ color: "#8b9dc3", fontSize: "0.875rem" }}>Loading...</div>
    </div>
  );
}
