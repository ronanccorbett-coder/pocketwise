"use client";
import { useRouter } from "next/navigation";
import { Zap, Lock, Check, Star } from "lucide-react";

type Lesson = {
  filename: string;
  title: string;
  order: number;
  xpReward: number;
  bloomsLevel: string;
};

type Props = {
  folder: string;
  lessons: Lesson[];
  completedLessons: string[];
  accentColor: string;
  moduleTitle: string;
};

// Generate winding path points for N nodes
function generatePath(count: number, width: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const nodeSpacingY = 110;
  const amplitude = width * 0.28;
  const centerX = width / 2;

  for (let i = 0; i < count; i++) {
    const y = 60 + i * nodeSpacingY;
    // Sine wave horizontal offset — alternates left and right
    const x = centerX + Math.sin(i * 1.2) * amplitude;
    points.push({ x, y });
  }
  return points;
}

// Generate smooth SVG path string between points
function buildSVGPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX1 = prev.x;
    const cpY1 = prev.y + (curr.y - prev.y) * 0.5;
    const cpX2 = curr.x;
    const cpY2 = prev.y + (curr.y - prev.y) * 0.5;
    d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export default function LessonPathMap({ folder, lessons, completedLessons, accentColor, moduleTitle }: Props) {
  const router = useRouter();
  const sorted = [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
  const count = sorted.length;

  if (count === 0) return (
    <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
      No lessons yet.
    </div>
  );

  const WIDTH = 320;
  const nodeSpacingY = 110;
  const HEIGHT = 60 + (count - 1) * nodeSpacingY + 80;
  const points = generatePath(count, WIDTH);
  const pathD = buildSVGPath(points);

  // Find current lesson index (first incomplete)
  const completedSet = new Set(completedLessons);
  const currentIdx = sorted.findIndex(l => !completedSet.has(`${folder}/${l.filename}`));
  const allDone = currentIdx === -1;

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 400, margin: "0 auto" }}>
        <svg
          width="100%"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ display: "block", overflow: "visible" }}
        >
          {/* Dashed background path */}
          <path
            d={pathD}
            fill="none"
            stroke="#2a3a5c"
            strokeWidth="4"
            strokeDasharray="8 6"
            strokeLinecap="round"
          />

          {/* Completed path overlay */}
          {currentIdx > 0 && (
            <path
              d={buildSVGPath(points.slice(0, currentIdx + 1))}
              fill="none"
              stroke={accentColor}
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.6"
            />
          )}

          {/* Nodes */}
          {sorted.map((lesson, i) => {
            const { x, y } = points[i];
            const isDone = completedSet.has(`${folder}/${lesson.filename}`);
            const isCurrent = i === currentIdx;
            const isLocked = !isDone && i > currentIdx;

            const nodeColor = isDone ? accentColor : isCurrent ? "#fff" : "#1a2540";
            const nodeStroke = isDone ? accentColor : isCurrent ? accentColor : "#2a3a5c";
            const nodeSize = isCurrent ? 28 : 22;

            return (
              <g key={lesson.filename}>
                {/* Pulse ring for current lesson */}
                {isCurrent && (
                  <>
                    <circle cx={x} cy={y} r={38} fill={accentColor} opacity="0.08">
                      <animate attributeName="r" values="32;42;32" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.12;0.04;0.12" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={x} cy={y} r={32} fill={accentColor} opacity="0.12" />
                  </>
                )}

                {/* Node circle */}
                <circle
                  cx={x} cy={y} r={nodeSize}
                  fill={nodeColor}
                  stroke={nodeStroke}
                  strokeWidth={isCurrent ? 3 : 2}
                  style={{ cursor: isLocked ? "not-allowed" : "pointer", transition: "all .2s" }}
                  onClick={() => {
                    if (!isLocked) {
                      router.push(`/lesson?folder=${folder}&filename=${lesson.filename}`);
                    }
                  }}
                />

                {/* Icon inside node */}
                {isDone ? (
                  <foreignObject x={x - 10} y={y - 10} width={20} height={20} style={{ pointerEvents: "none" }}>
                    <Check size={18} color="#fff" strokeWidth={3} />
                  </foreignObject>
                ) : isLocked ? (
                  <foreignObject x={x - 8} y={y - 8} width={16} height={16} style={{ pointerEvents: "none" }}>
                    <Lock size={14} color="#4a5a7a" />
                  </foreignObject>
                ) : (
                  <text x={x} y={y + 5} textAnchor="middle" fill={isCurrent ? accentColor : "#fff"} fontSize="12" fontWeight="800" fontFamily="Inter, sans-serif" style={{ pointerEvents: "none" }}>
                    {lesson.order || i + 1}
                  </text>
                )}

                {/* Label — alternates left/right of node */}
                <foreignObject
                  x={x > WIDTH / 2 ? x - 145 : x + 36}
                  y={y - 22}
                  width={108}
                  height={44}
                  style={{ pointerEvents: "none", overflow: "visible" }}
                >
                  <div style={{
                    fontSize: "0.72rem",
                    fontWeight: isCurrent ? 700 : 500,
                    color: isDone ? "#64748b" : isCurrent ? "#fff" : "#475569",
                    lineHeight: 1.3,
                    textDecoration: isDone ? "line-through" : "none",
                    fontFamily: "Inter, sans-serif",
                  }}>
                    {lesson.title}
                  </div>
                  {isCurrent && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                      <span style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>{lesson.xpReward} XP</span>
                    </div>
                  )}
                </foreignObject>
              </g>
            );
          })}

          {/* All done star at the end */}
          {allDone && points.length > 0 && (
            <g>
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={28} fill={accentColor} opacity="0.2" />
              <foreignObject x={points[points.length - 1].x - 14} y={points[points.length - 1].y - 14} width={28} height={28}>
                <Star size={24} fill={accentColor} color={accentColor} />
              </foreignObject>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
