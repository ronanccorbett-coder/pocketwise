"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/lib/theme";
import { useGame } from "@/lib/gameContext";
import { Zap, Lock, Check, Star, ArrowLeft, Flame, ChevronRight } from "lucide-react";

const FONT = "Inter, system-ui, sans-serif";

type Lesson = {
  filename: string;
  title: string;
  order: number;
  xpReward: number;
  bloomsLevel?: string;
  nceaFocus?: string;
};

type ModuleData = {
  folder: string;
  title: string;
  description?: string;
  nceaStandard?: string;
  nceaCredits?: number;
  xpReward: number;
  colorTheme?: string;
  lessons: Lesson[];
  lessonCount: number;
};

// ── Path generation ───────────────────────────────────────────────────────
function generateNodes(count: number, svgW: number, svgH: number) {
  const nodes: { x: number; y: number }[] = [];
  const padX = 80;
  const padY = 70;
  const usableW = svgW - padX * 2;
  const rowHeight = Math.min(110, (svgH - padY * 2) / Math.max(count - 1, 1));
  const centerX = padX + usableW / 2;
  const amp = usableW * 0.38;

  for (let i = 0; i < count; i++) {
    const y = padY + i * rowHeight;
    // Smooth sine wave — full period over all nodes
    const t = count <= 1 ? 0 : i / (count - 1);
    const x = centerX + Math.sin(t * Math.PI * 2.2) * amp;
    nodes.push({ x: Math.round(x), y: Math.round(y) });
  }
  return nodes;
}

// Build a smooth path that passes EXACTLY through every node point
// Uses Catmull-Rom spline converted to cubic bezier
function buildPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];

    // Catmull-Rom tension = 0.4 (tighter curve)
    const t = 0.4;
    const cp1x = p1.x + (p2.x - p0.x) * t / 2;
    const cp1y = p1.y + (p2.y - p0.y) * t / 2;
    const cp2x = p2.x - (p3.x - p1.x) * t / 2;
    const cp2y = p2.y - (p3.y - p1.y) * t / 2;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }

  return d;
}

// ── Unlock animation component ────────────────────────────────────────────
function UnlockBurst({ x, y, color, onDone }: { x: number; y: number; color: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <g>
      {/* Expanding rings */}
      {[0, 1, 2].map(i => (
        <circle key={i} cx={x} cy={y} r={20} fill="none" stroke={color} strokeWidth={2} opacity={0}
          style={{ animation: `unlockRing 0.8s ease-out ${i * 0.15}s forwards` }} />
      ))}
      {/* Star burst particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const tx = Math.cos(angle) * 40;
        const ty = Math.sin(angle) * 40;
        return (
          <circle key={i} cx={x} cy={y} r={4} fill={color} opacity={1}
            style={{ animation: `particle 0.7s ease-out ${i * 0.05}s forwards`, transformOrigin: `${x}px ${y}px` }}
            transform={`translate(${tx},${ty})`} />
        );
      })}
    </g>
  );
}

// ── Module Map Page ────────────────────────────────────────────────────────
function ModuleMapContent() {
  const { isDark } = useTheme();
  const T = {
    bg:     isDark ? "#060d1a" : "#f0f4f8",
    bg2:    isDark ? "#111c30" : "#ffffff",
    text:   isDark ? "#ffffff" : "#0d1526",
    text2:  isDark ? "#8b9dc3" : "#475569",
    text3:  isDark ? "#4a6a8a" : "#94a3b8",
    card:   isDark ? "#111c30" : "#ffffff",
    border: isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)",
    shadow: isDark ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.1)",
    green:  isDark ? "#76AD25" : "#5a9a1a",
    accent: isDark ? "#f59e0b" : "#d97706",
  };
  const searchParams = useSearchParams();
  const router = useRouter();
  const folder = searchParams.get("folder");
  const { state } = useGame();

  const [mod, setMod] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const prevCompleted = useRef<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!folder) return;
    fetch(`/api/modules`)
      .then(r => r.json())
      .then(d => {
        const found = d.modules?.find((m: ModuleData) => m.folder === folder);
        if (found) setMod(found);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [folder]);

  const completedLessons = (state?.completedLessons as string[]) ?? [];
  const completedSet = new Set(completedLessons);

  // Detect newly unlocked lessons
  useEffect(() => {
    if (!mod) return;
    const sorted = [...mod.lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
    sorted.forEach((l, i) => {
      const key = `${folder}/${l.filename}`;
      const wasDone = prevCompleted.current.has(key);
      const isDone = completedSet.has(key);
      if (isDone && !wasDone && i < sorted.length - 1) {
        // Next lesson just got unlocked
        setNewlyUnlocked(i + 1);
        setTimeout(() => setNewlyUnlocked(null), 2000);
      }
    });
    prevCompleted.current = completedSet;
  }, [completedLessons, mod, folder]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#060d1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(118,173,37,.2)", borderTopColor: "#76AD25", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#8b9dc3", fontSize: "0.875rem", fontFamily: FONT }}>Loading...</p>
      </div>
    </div>
  );

  if (!mod) return (
    <div style={{ minHeight: "100vh", background: "#060d1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <p style={{ color: "#8b9dc3", fontFamily: FONT }}>Module not found.</p>
      <button onClick={() => router.push("/curriculum")} style={{ padding: "10px 20px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: FONT, fontWeight: 700 }}>Back</button>
    </div>
  );

  const accent = mod.colorTheme ?? "#76AD25";
  const sorted = [...mod.lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
  const currentIdx = sorted.findIndex(l => !completedSet.has(`${folder}/${l.filename}`));
  const allDone = currentIdx === -1;
  const completedCount = sorted.filter(l => completedSet.has(`${folder}/${l.filename}`)).length;
  const progressPct = sorted.length > 0 ? (completedCount / sorted.length) * 100 : 0;

  // SVG dimensions
  const SVG_W = 380;
  const SVG_H = Math.max(500, sorted.length * 115 + 100);

  const nodes = generateNodes(sorted.length, SVG_W, SVG_H);
  const pathD = buildPath(nodes);

  // Selected lesson info
  const selectedLesson = selectedNode !== null ? sorted[selectedNode] : null;
  const selectedDone = selectedLesson ? completedSet.has(`${folder}/${selectedLesson.filename}`) : false;
  const selectedLocked = selectedLesson && selectedNode !== null ? (selectedNode > currentIdx && currentIdx !== -1) : false;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 30% 20%, #0a1628 0%, #060d1a 60%, #020608 100%)", fontFamily: FONT, overflowX: "hidden" }}>

      {/* Stars background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() > 0.8 ? 2 : 1,
            height: Math.random() > 0.8 ? 2 : 1,
            borderRadius: "50%",
            background: T.card,
            opacity: Math.random() * 0.6 + 0.1,
          }} />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <button onClick={() => router.push("/curriculum")} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>
              {mod.nceaStandard ?? "Module"}
            </div>
            <h1 style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fff", lineHeight: 1.2 }}>{mod.title}</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
              <Zap size={13} color="#f59e0b" />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f59e0b" }}>{mod.xpReward} XP</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#8b9dc3", marginTop: 2 }}>{completedCount}/{sorted.length} done</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "rgba(255,255,255,.06)" }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${accent}, ${accent}aa)`, width: `${progressPct}%`, transition: "width 0.6s ease", borderRadius: "0 99px 99px 0" }} />
        </div>

        {/* Main map area */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0 120px" }}>

          {/* SVG Map */}
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ maxWidth: 460, display: "block", overflow: "visible" }}
          >
            <defs>
              {/* Glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glowStrong">
                <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Node gradients */}
              <radialGradient id="nodeGradDone" cx="40%" cy="35%">
                <stop offset="0%" stopColor={accent} stopOpacity="1" />
                <stop offset="100%" stopColor={accent} stopOpacity="0.7" />
              </radialGradient>
              <radialGradient id="nodeGradCurrent" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                <stop offset="100%" stopColor="#c8e6ff" stopOpacity="0.9" />
              </radialGradient>
              <radialGradient id="nodeGradLocked" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#1a2540" stopOpacity="1" />
                <stop offset="100%" stopColor="#0d1526" stopOpacity="1" />
              </radialGradient>
            </defs>

            {/* Ground shadow path */}
            <path d={pathD} fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="10" strokeLinecap="round" transform="translate(0,4)" />

            {/* Track path — locked section */}
            <path d={pathD} fill="none" stroke="#1a2540" strokeWidth="8" strokeLinecap="round" />

            {/* Track path — completed section */}
            {currentIdx > 0 && (
              <path d={buildPath(nodes.slice(0, Math.max(currentIdx, 1)))} fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" opacity="0.7" filter="url(#glow)" />
            )}
            {allDone && (
              <path d={pathD} fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" opacity="0.7" filter="url(#glow)" />
            )}

            {/* Track dots pattern */}
            <path d={pathD} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="4" strokeDasharray="4 8" strokeLinecap="round" />

            {/* Nodes */}
            {sorted.map((lesson, i) => {
              const { x, y } = nodes[i];
              const isDone = completedSet.has(`${folder}/${lesson.filename}`);
              const isCurrent = i === currentIdx;
              const isLocked = !isDone && !isCurrent;
              const isHovered = hoveredNode === i;
              const isSelected = selectedNode === i;

              const r = isCurrent ? 30 : isDone ? 26 : 22;
              const gradId = isDone ? "nodeGradDone" : isCurrent ? "nodeGradCurrent" : "nodeGradLocked";
              const scale = isHovered && !isLocked ? 1.12 : isSelected ? 1.08 : 1;

              return (
                <g key={lesson.filename}
                  style={{ cursor: isLocked ? "not-allowed" : "pointer", transform: `scale(${scale})`, transformOrigin: `${x}px ${y}px`, transition: "transform 0.2s cubic-bezier(.34,1.56,.64,1)" }}
                  onClick={() => {
                    if (!isLocked) setSelectedNode(selectedNode === i ? null : i);
                  }}
                  onMouseEnter={() => setHoveredNode(i)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer glow for current */}
                  {isCurrent && (
                    <circle cx={x} cy={y} r={r + 16} fill={accent} opacity="0.07">
                      <animate attributeName="r" values={`${r + 10};${r + 22};${r + 10}`} dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.1;0.04;0.1" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Extra pulse ring for current */}
                  {isCurrent && (
                    <circle cx={x} cy={y} r={r + 8} fill="none" stroke={accent} strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" values={`${r};${r+20};${r}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Hover ring */}
                  {(isHovered || isSelected) && !isLocked && (
                    <circle cx={x} cy={y} r={r + 10} fill="none" stroke={isDone ? accent : isCurrent ? "#fff" : "#475569"} strokeWidth={1.5} opacity={0.4} />
                  )}

                  {/* Shadow */}
                  <ellipse cx={x} cy={y + r + 6} rx={r * 0.8} ry={5} fill="rgba(0,0,0,.35)" />

                  {/* Main node circle */}
                  <circle
                    cx={x} cy={y} r={r}
                    fill={`url(#${gradId})`}
                    stroke={isDone ? accent : isCurrent ? "#fff" : "#2a3a5c"}
                    strokeWidth={isCurrent ? 3 : 2}
                    filter={isDone || isCurrent ? "url(#glow)" : "none"}
                    style={{ transition: "r 0.3s ease" }}
                  />

                  {/* Inner highlight (3D effect) */}
                  <ellipse
                    cx={x - r * 0.25} cy={y - r * 0.3}
                    rx={r * 0.45} ry={r * 0.28}
                    fill="rgba(255,255,255,.22)"
                  />

                  {/* Icon */}
                  {isDone && (
                    <g transform={`translate(${x - 10},${y - 10})`}>
                      <Check size={20} color="#fff" strokeWidth={3} />
                    </g>
                  )}
                  {isCurrent && (
                    <text x={x} y={y + 5} textAnchor="middle" fill={accent} fontSize="14" fontWeight="900" fontFamily={FONT}>
                      {lesson.order || i + 1}
                    </text>
                  )}
                  {isLocked && (
                    <g transform={`translate(${x - 7},${y - 8})`}>
                      <Lock size={15} color="#4a5a7a" />
                    </g>
                  )}
                  {!isDone && !isCurrent && !isLocked && (
                    <text x={x} y={y + 5} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="700" fontFamily={FONT}>
                      {lesson.order || i + 1}
                    </text>
                  )}

                  {/* XP badge for current */}
                  {isCurrent && (
                    <g>
                      <rect x={x + r - 2} y={y - r - 18} rx={8} ry={8} width={42} height={18} fill={accent} />
                      <text x={x + r + 19} y={y - r - 6} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800" fontFamily={FONT}>
                        +{lesson.xpReward}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Unlock burst animation */}
            {newlyUnlocked !== null && nodes[newlyUnlocked] && (
              <UnlockBurst
                x={nodes[newlyUnlocked].x}
                y={nodes[newlyUnlocked].y}
                color={accent}
                onDone={() => setNewlyUnlocked(null)}
              />
            )}

            {/* All done star */}
            {allDone && nodes.length > 0 && (
              <g transform={`translate(${nodes[nodes.length - 1].x - 16},${nodes[nodes.length - 1].y - 48})`}>
                <Star size={32} fill="#f59e0b" color="#f59e0b" filter="url(#glowStrong)" />
              </g>
            )}
          </svg>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { color: accent, label: "Complete" },
              { color: "#fff", label: "Current" },
              { color: "#1a2540", label: "Locked", border: "#2a3a5c" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: l.color, border: l.border ? `1px solid ${l.border}` : "none" }} />
                <span style={{ fontSize: "0.72rem", color: "#8b9dc3" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom panel — lesson info + start button */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(6,13,26,.96)", backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,.07)",
        padding: selectedNode !== null ? "20px 24px 28px" : "16px 24px 20px",
        transition: "padding 0.2s",
      }}>
        {selectedNode !== null && selectedLesson ? (
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.68rem", color: "#8b9dc3", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>
                  Lesson {selectedLesson.order ?? selectedNode + 1}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "#fff", lineHeight: 1.3 }}>
                  {selectedLesson.title}
                </h3>
                {selectedLesson.bloomsLevel && (
                  <div style={{ fontSize: "0.72rem", color: T.text2, marginTop: 4 }}>{selectedLesson.bloomsLevel}</div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(245,158,11,.15)", padding: "4px 12px", borderRadius: 99, marginLeft: 12, flexShrink: 0 }}>
                <Zap size={13} color="#f59e0b" />
                <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#f59e0b" }}>{selectedLesson.xpReward} XP</span>
              </div>
            </div>

            {selectedLocked ? (
              <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
                <Lock size={16} color="#4a5a7a" style={{ margin: "0 auto 6px", display: "block" }} />
                <p style={{ color: "#4a5a7a", fontSize: "0.825rem" }}>Complete the previous lesson to unlock this one.</p>
              </div>
            ) : (
              <button
                onClick={() => router.push(`/lesson?folder=${folder}&filename=${selectedLesson.filename}`)}
                className={selectedDone ? "btn-3d-ghost" : "btn-3d-green"}
                style={{
                  width: "100%", padding: "15px",
                  borderRadius: 14, fontWeight: 800, fontSize: "1rem",
                  cursor: "pointer", fontFamily: FONT,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {selectedDone ? (
                  <><Check size={18} /> Review Lesson</>
                ) : (
                  <>Start Lesson <ChevronRight size={18} /></>
                )}
              </button>
            )}
            )}
          </div>
        ) : (
          <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ color: "#8b9dc3", fontSize: "0.8rem", marginBottom: 2 }}>
                {allDone ? "Module complete!" : `${completedCount} of ${sorted.length} lessons done`}
              </p>
              {!allDone && currentIdx >= 0 && (
                <p style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 600 }}>
                  Up next: {sorted[currentIdx]?.title}
                </p>
              )}
            </div>
            {!allDone && currentIdx >= 0 && (
              <button
                onClick={() => router.push(`/lesson?folder=${folder}&filename=${sorted[currentIdx].filename}`)}
                className="btn-3d-green"
                style={{
                  padding: "13px 24px",
                  borderRadius: 12, fontWeight: 800, fontSize: "0.9rem", cursor: "pointer",
                  fontFamily: FONT, display: "flex", alignItems: "center", gap: 6,
                }}>
                Continue <ChevronRight size={16} />
              </button>
            )}
            {allDone && (
              <button
                onClick={() => router.push("/curriculum")}
                style={{
                  padding: "13px 24px",
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  color: "#fff", border: "none", borderRadius: 12,
                  fontWeight: 800, fontSize: "0.9rem", cursor: "pointer",
                  fontFamily: FONT, display: "flex", alignItems: "center", gap: 6,
                  boxShadow: `0 4px 20px ${accent}44`,
                }}>
                <Star size={16} /> Back to Curriculum
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes unlockRing {
          0%   { r: 20; opacity: 0.8; }
          100% { r: 55; opacity: 0; }
        }
        @keyframes particle {
          0%   { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(0,0) scale(0); }
        }
      `}</style>
    </div>
  );
}

export default function ModuleMapPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#060d1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#8b9dc3", fontFamily: FONT }}>Loading...</div>
      </div>
    }>
      <ModuleMapContent />
    </Suspense>
  );
}
