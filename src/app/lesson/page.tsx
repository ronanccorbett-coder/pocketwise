"use client";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/lib/theme";
import { useGame } from "@/lib/gameContext";
import { SadKiwiOverlay, CornerCelebration } from "@/components/Mascot";
import Confetti from "@/components/Confetti";
import XPCounter from "@/components/XPCounter";
import {
  ChevronLeft, ChevronRight, Zap, Check, X,
  Heart, BookOpen, ArrowRight, Flame,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type Activity = {
  type: "slide"|"quiz"|"truefalse"|"dragdrop"|"typed"|"vocabulary"|"scenario"|"reflection"|"discussion";
  title?: string; statement?: string; question?: string; content?: string; prompt?: string;
  estimatedMinutes?: number; nceaLevel?: string;
  questions?: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  correctAnswer?: boolean; explanation?: string;
  pairs?: { item: string; zone: string }[];
  acceptedAnswers?: string[]; placeholder?: string; hint?: string;
  setup?: string; challenge?: string; hints?: string[]; solution?: string;
  guidingQuestions?: string[]; nceaLink?: string;
  instruction?: string;
};

type LessonData = {
  title: string; order: number; xpReward: number;
  bloomsLevel: string; nceaFocus: string;
  objectives: string[];
  vocabulary: { term: string; definition: string }[];
  activities: Activity[];
};

const FONT = "Inter, system-ui, sans-serif";

// ── Animation helper ──────────────────────────────────────────────────────
function useShake() {
  const [shaking, setShaking] = useState(false);
  const shake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);
  return { shaking, shake };
}

// ── Floating XP popup ─────────────────────────────────────────────────────
function XPFloat({ show }: { show: boolean }) {
  return (
    <div style={{
      position: "fixed", top: "40%", left: "50%", transform: `translate(-50%, ${show ? "-60px" : "0px"})`,
      opacity: show ? 1 : 0, transition: "all 0.6s ease-out",
      background: "#76AD25", color: "#fff", fontWeight: 800,
      fontSize: "1.1rem", padding: "8px 20px", borderRadius: 99,
      zIndex: 200, pointerEvents: "none",
      display: "flex", alignItems: "center", gap: 6,
    }}>
      <Zap size={16} /> +10 XP
    </div>
  );
}

// ── Hearts display ────────────────────────────────────────────────────────
function HeartsBar({ hearts, maxHearts = 3 }: { hearts: number; maxHearts?: number }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: maxHearts }).map((_, i) => (
        <Heart
          key={i}
          size={22}
          fill={i < hearts ? "#EF4444" : "none"}
          color={i < hearts ? "#EF4444" : "#cbd5e1"}
          style={{ transition: "all 0.3s" }}
        />
      ))}
    </div>
  );
}

// ── SLIDE ─────────────────────────────────────────────────────────────────
function SlideActivity({ a }: { a: Activity }) {
  return (
    <div style={{ animation: "slideIn 0.3s ease-out" }}>
      <div style={{
        background: "rgba(255,255,255,.05)", borderRadius: 6,
        padding: "3px 12px", display: "inline-block", marginBottom: 20,
        fontSize: "0.72rem", fontWeight: 700, color: "#76AD25",
        textTransform: "uppercase", letterSpacing: ".06em",
      }}>Reading</div>
      <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem, 3vw, 1.6rem)", color: "#fff", marginBottom: 24, lineHeight: 1.3 }}>
        {a.title}
      </h2>
      <div style={{
        background: "rgba(255,255,255,.06)", borderRadius: 16,
        padding: "24px 28px",
        fontSize: "0.95rem", color: T.text3, lineHeight: 1.9,
        whiteSpace: "pre-wrap",
        border: "1px solid rgba(255,255,255,.08)",
      }}>
        {a.content}
      </div>
    </div>
  );
}

// ── QUIZ ──────────────────────────────────────────────────────────────────
function QuizActivity({ a, onPass, onWrong }: { a: Activity; onPass: () => void; onWrong: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [locked, setLocked] = useState<Record<number, boolean>>({});
  const [showFloat, setShowFloat] = useState(false);
  const { shaking, shake } = useShake();
  const questions = a.questions ?? [];

  function answer(qi: number, oi: number, correct: number) {
    if (locked[qi]) return;
    const attempt = (attempts[qi] ?? 0) + 1;
    setAttempts(p => ({ ...p, [qi]: attempt }));
    setAnswers(p => ({ ...p, [qi]: oi }));
    const isCorrect = oi === correct;
    if (isCorrect) {
      setLocked(p => ({ ...p, [qi]: true }));
      setShowFloat(true);
      setTimeout(() => setShowFloat(false), 800);
    } else if (attempt >= 2) {
      setLocked(p => ({ ...p, [qi]: true }));
      onWrong();
    } else {
      shake();
      onWrong();
    }
    const allDone = questions.every((q, i) => {
      const k = locked[i] || (i === qi && (isCorrect || attempt >= 2));
      return k;
    });
    if (allDone && isCorrect) onPass();
    else if (allDone && !isCorrect) onPass(); // still allow progress after 2 attempts
  }

  return (
    <div style={{ animation: "slideIn 0.3s ease-out" }}>
      <XPFloat show={showFloat} />
      <div style={{ background: "rgba(59,130,246,.15)", borderRadius: 6, padding: "3px 12px", display: "inline-block", marginBottom: 20, fontSize: "0.72rem", fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", letterSpacing: ".06em" }}>
        Quiz {a.nceaLevel ? `· ${a.nceaLevel}` : ""}
      </div>
      {questions.map((q, qi) => (
        <div key={qi} style={{ marginBottom: 32 }}>
          <h2 style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.3rem)", color: "#fff", marginBottom: 20, lineHeight: 1.4 }}>
            {q.question}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map((opt, oi) => {
              const isAnswered = answers[qi] !== undefined;
              const isSelected = answers[qi] === oi;
              const isCorrect = oi === q.correctIndex;
              const isWrong = isSelected && !isCorrect;
              let bg = "rgba(255,255,255,.07)";
              let border = "1px solid rgba(255,255,255,.12)";
              let color = "#fff";
              if (isAnswered && locked[qi]) {
                if (isCorrect) { bg = "rgba(118,173,37,.2)"; border = "1.5px solid #76AD25"; color = "#76AD25"; }
                else if (isWrong) { bg = "rgba(239,68,68,.15)"; border = "1.5px solid #EF4444"; color = "#EF4444"; }
              }
              return (
                <button
                  key={oi}
                  onClick={() => answer(qi, oi, q.correctIndex)}
                  style={{
                    padding: "16px 20px", borderRadius: 12, border, background: bg, color,
                    fontWeight: 600, fontSize: "0.95rem", cursor: locked[qi] ? "default" : "pointer",
                    fontFamily: FONT, textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                    animation: isWrong && shaking ? "shake 0.4s ease" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "0.8rem", fontWeight: 800,
                  }}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                  {isAnswered && locked[qi] && isCorrect && <Check size={16} style={{ marginLeft: "auto" }} />}
                  {isAnswered && locked[qi] && isWrong && <X size={16} style={{ marginLeft: "auto" }} />}
                </button>
              );
            })}
          </div>
          {locked[qi] && q.explanation && (
            <div style={{
              marginTop: 14, padding: "14px 18px", borderRadius: 12,
              background: answers[qi] === q.correctIndex ? "rgba(118,173,37,.12)" : "rgba(239,68,68,.1)",
              border: `1px solid ${answers[qi] === q.correctIndex ? "rgba(118,173,37,.3)" : "rgba(239,68,68,.25)"}`,
              fontSize: "0.875rem", color: T.text3, lineHeight: 1.6,
              animation: "fadeIn 0.3s ease",
            }}>
              {q.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── TRUE / FALSE ──────────────────────────────────────────────────────────
function TrueFalseActivity({ a, onPass, onWrong }: { a: Activity; onPass: () => void; onWrong: () => void }) {
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [showFloat, setShowFloat] = useState(false);
  const correct = a.correctAnswer === true || (a.correctAnswer as any) === "true";

  function answer(val: boolean) {
    if (locked) return;
    const attempt = attempts + 1;
    setAttempts(attempt);
    setAnswered(val);
    if (val === correct) {
      setLocked(true);
      setShowFloat(true);
      setTimeout(() => setShowFloat(false), 800);
      onPass();
    } else if (attempt >= 2) {
      setLocked(true);
      onWrong();
      onPass();
    } else {
      onWrong();
    }
  }

  return (
    <div style={{ animation: "slideIn 0.3s ease-out" }}>
      <XPFloat show={showFloat} />
      <div style={{ background: "rgba(245,158,11,.15)", borderRadius: 6, padding: "3px 12px", display: "inline-block", marginBottom: 20, fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: ".06em" }}>
        True or False
      </div>
      <h2 style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.4rem)", color: "#fff", marginBottom: 32, lineHeight: 1.4 }}>
        {a.statement}
      </h2>
      <div style={{ display: "flex", gap: 14 }}>
        {[true, false].map(val => {
          let bg = "rgba(255,255,255,.07)";
          let border = "1.5px solid rgba(255,255,255,.12)";
          let color = "#fff";
          if (locked && answered !== null) {
            if (val === correct) { bg = "rgba(118,173,37,.2)"; border = "1.5px solid #76AD25"; color = "#76AD25"; }
            else if (val === answered && answered !== correct) { bg = "rgba(239,68,68,.15)"; border = "1.5px solid #EF4444"; color = "#EF4444"; }
          }
          return (
            <button key={String(val)} onClick={() => answer(val)} style={{
              flex: 1, padding: "22px", borderRadius: 14, border, background: bg, color,
              fontWeight: 800, fontSize: "1.25rem", cursor: locked ? "default" : "pointer",
              fontFamily: FONT, transition: "all .15s",
            }}>
              {val ? "True" : "False"}
              {locked && val === correct && <div style={{ fontSize: "0.75rem", marginTop: 4, opacity: 0.8 }}>Correct</div>}
            </button>
          );
        })}
      </div>
      {locked && a.explanation && (
        <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 12, background: answered === correct ? "rgba(118,173,37,.12)" : "rgba(239,68,68,.1)", border: `1px solid ${answered === correct ? "rgba(118,173,37,.3)" : "rgba(239,68,68,.25)"}`, fontSize: "0.875rem", color: T.text3, lineHeight: 1.6, animation: "fadeIn 0.3s ease" }}>
          {a.explanation}
        </div>
      )}
    </div>
  );
}

// ── DRAG AND DROP ─────────────────────────────────────────────────────────
function DragDropActivity({ a, onPass, onWrong }: { a: Activity; onPass: () => void; onWrong: () => void }) {
  const pairs = a.pairs ?? [];
  const zones = Array.from(new Set(pairs.map(p => p.zone)));
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [dragging, setDragging] = useState<string | null>(null);
  const [correct, setCorrect] = useState(false);

  const placed = Object.keys(placements);
  const unplaced = pairs.map(p => p.item).filter(item => !placed.includes(item));

  function check() {
    const att = attempts + 1;
    setAttempts(att);
    setChecked(true);
    const allCorrect = pairs.every(p => placements[p.item] === p.zone);
    if (allCorrect) { setCorrect(true); onPass(); }
    else if (att >= 2) { onWrong(); onPass(); }
    else { setTimeout(() => { setChecked(false); setPlacements({}); }, 1200); onWrong(); }
  }

  return (
    <div style={{ animation: "slideIn 0.3s ease-out" }}>
      <div style={{ background: "rgba(167,139,250,.15)", borderRadius: 6, padding: "3px 12px", display: "inline-block", marginBottom: 20, fontSize: "0.72rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: ".06em" }}>
        Drag and Drop
      </div>
      <h2 style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.3rem)", color: "#fff", marginBottom: 8, lineHeight: 1.4 }}>
        {a.title ?? "Match each item to the correct category"}
      </h2>
      <p style={{ color: "#8b9dc3", fontSize: "0.825rem", marginBottom: 20 }}>Drag items into the correct boxes</p>

      {/* Unplaced items pool */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 50, padding: "12px", background: "rgba(255,255,255,.04)", borderRadius: 12, border: "1.5px dashed rgba(255,255,255,.12)", marginBottom: 20 }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          if (!dragging) return;
          setPlacements(p => { const n = { ...p }; delete n[dragging]; return n; });
          setDragging(null);
        }}>
        {unplaced.map(item => (
          <div key={item} draggable
            onDragStart={() => setDragging(item)}
            onDragEnd={() => setDragging(null)}
            style={{
              padding: "8px 16px", background: "rgba(255,255,255,.1)",
              border: "1.5px solid rgba(255,255,255,.2)", borderRadius: 8,
              color: "#fff", fontWeight: 600, fontSize: "0.875rem",
              cursor: "grab", userSelect: "none",
              opacity: dragging === item ? 0.4 : 1,
            }}>
            {item}
          </div>
        ))}
        {unplaced.length === 0 && <div style={{ color: "#4a5a7a", fontSize: "0.8rem", alignSelf: "center" }}>All items placed</div>}
      </div>

      {/* Drop zones */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {zones.map(zone => {
          const itemsHere = Object.entries(placements).filter(([, z]) => z === zone).map(([item]) => item);
          const expectedItems = pairs.filter(p => p.zone === zone).map(p => p.item);
          const zoneCorrect = checked && itemsHere.length > 0 && itemsHere.every(i => expectedItems.includes(i));
          const zoneWrong = checked && itemsHere.some(i => !expectedItems.includes(i));
          return (
            <div key={zone}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (!dragging) return;
                setPlacements(p => ({ ...p, [dragging]: zone }));
                setDragging(null);
              }}
              style={{
                padding: "12px 16px", borderRadius: 12,
                border: `1.5px solid ${zoneCorrect ? "#76AD25" : zoneWrong ? "#EF4444" : "rgba(255,255,255,.15)"}`,
                background: zoneCorrect ? "rgba(118,173,37,.1)" : zoneWrong ? "rgba(239,68,68,.08)" : "rgba(255,255,255,.04)",
                minHeight: 54, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#8b9dc3", flexShrink: 0, minWidth: 100 }}>{zone}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
                {itemsHere.map(item => (
                  <div key={item}
                    draggable
                    onDragStart={() => setDragging(item)}
                    style={{
                      padding: "6px 14px", borderRadius: 7, fontWeight: 600, fontSize: "0.85rem",
                      cursor: "grab", userSelect: "none",
                      background: zoneCorrect ? "rgba(118,173,37,.25)" : zoneWrong ? "rgba(239,68,68,.2)" : "rgba(255,255,255,.12)",
                      color: zoneCorrect ? "#76AD25" : zoneWrong ? "#EF4444" : "#fff",
                      border: `1px solid ${zoneCorrect ? "#76AD25" : zoneWrong ? "#EF4444" : "rgba(255,255,255,.2)"}`,
                    }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!checked && placed.length > 0 && (
        <button onClick={check} style={{ width: "100%", padding: "14px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: FONT }}>
          Check Answer
        </button>
      )}
      {checked && correct && (
        <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(118,173,37,.12)", border: "1px solid rgba(118,173,37,.3)", fontSize: "0.875rem", color: "#76AD25", fontWeight: 600, animation: "fadeIn 0.3s ease" }}>
          {a.explanation ?? "All correct!"}
        </div>
      )}
    </div>
  );
}

// ── TYPED ─────────────────────────────────────────────────────────────────
function TypedActivity({ a, onPass, onWrong }: { a: Activity; onPass: () => void; onWrong: () => void }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"correct"|"wrong"|null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showFloat, setShowFloat] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const val = value.trim().toLowerCase();
    const accepted = (a.acceptedAnswers ?? []).map(x => x.toLowerCase());
    const isCorrect = accepted.includes(val);
    const attempt = attempts + 1;
    setAttempts(attempt);
    if (isCorrect) {
      setResult("correct");
      setShowFloat(true);
      setTimeout(() => setShowFloat(false), 800);
      onPass();
    } else if (attempt >= 2) {
      setResult("wrong");
      onWrong();
      onPass();
    } else {
      setResult("wrong");
      onWrong();
      setTimeout(() => { setResult(null); setValue(""); inputRef.current?.focus(); }, 800);
    }
  }

  return (
    <div style={{ animation: "slideIn 0.3s ease-out" }}>
      <XPFloat show={showFloat} />
      <div style={{ background: "rgba(14,165,233,.15)", borderRadius: 6, padding: "3px 12px", display: "inline-block", marginBottom: 20, fontSize: "0.72rem", fontWeight: 700, color: "#7dd3fc", textTransform: "uppercase", letterSpacing: ".06em" }}>
        Type Your Answer
      </div>
      <h2 style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.35rem)", color: "#fff", marginBottom: 28, lineHeight: 1.4 }}>
        {a.question}
      </h2>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !result && submit()}
        placeholder={a.placeholder ?? "Type your answer..."}
        disabled={result === "correct" || (result === "wrong" && attempts >= 2)}
        autoFocus
        style={{
          width: "100%", padding: "16px 20px",
          background: result === "correct" ? "rgba(118,173,37,.15)" : result === "wrong" ? "rgba(239,68,68,.1)" : "rgba(255,255,255,.07)",
          border: `2px solid ${result === "correct" ? "#76AD25" : result === "wrong" ? "#EF4444" : "rgba(255,255,255,.15)"}`,
          borderRadius: 12, color: "#fff", fontFamily: FONT, fontSize: "1rem",
          outline: "none", marginBottom: 12, transition: "all .2s",
          animation: result === "wrong" && attempts < 2 ? "shake 0.4s ease" : "none",
        }}
      />
      {a.hint && !result && <p style={{ fontSize: "0.8rem", color: "#8b9dc3", marginBottom: 16, fontStyle: "italic" }}>Hint: {a.hint}</p>}
      {result === null && (
        <button onClick={submit} disabled={!value.trim()} style={{ width: "100%", padding: "14px", background: value.trim() ? "#76AD25" : "rgba(255,255,255,.08)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: value.trim() ? "pointer" : "not-allowed", fontFamily: FONT }}>
          Submit
        </button>
      )}
      {result === "correct" && (
        <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(118,173,37,.12)", border: "1px solid rgba(118,173,37,.3)", fontSize: "0.875rem", color: "#76AD25", fontWeight: 600, animation: "fadeIn 0.3s ease" }}>
          Correct! {a.explanation}
        </div>
      )}
      {result === "wrong" && attempts >= 2 && (
        <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", fontSize: "0.875rem", color: "#fca5a5", animation: "fadeIn 0.3s ease" }}>
          The answer is: {(a.acceptedAnswers ?? []).join(" or ")}. {a.explanation}
        </div>
      )}
    </div>
  );
}

// ── VOCABULARY ────────────────────────────────────────────────────────────
function VocabActivity({ a, vocab }: { a: Activity; vocab: { term: string; definition: string }[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  return (
    <div style={{ animation: "slideIn 0.3s ease-out" }}>
      <div style={{ background: "rgba(167,139,250,.15)", borderRadius: 6, padding: "3px 12px", display: "inline-block", marginBottom: 20, fontSize: "0.72rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: ".06em" }}>
        Key Terms
      </div>
      <h2 style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.3rem)", color: "#fff", marginBottom: 6 }}>{a.title ?? "Vocabulary"}</h2>
      <p style={{ color: "#8b9dc3", fontSize: "0.825rem", marginBottom: 24 }}>Tap each card to see the definition</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {vocab.map((v, i) => (
          <div key={i} onClick={() => setFlipped(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })} style={{ background: flipped.has(i) ? "rgba(118,173,37,.12)" : "rgba(255,255,255,.06)", border: `1.5px solid ${flipped.has(i) ? "rgba(118,173,37,.4)" : "rgba(255,255,255,.1)"}`, borderRadius: 14, padding: "18px", cursor: "pointer", minHeight: 100, display: "flex", flexDirection: "column", justifyContent: "center", transition: "all .2s" }}>
            {flipped.has(i) ? (
              <p style={{ color: T.text3, fontSize: "0.875rem", lineHeight: 1.6 }}>{v.definition}</p>
            ) : (
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>{v.term}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SCENARIO ──────────────────────────────────────────────────────────────
function ScenarioActivity({ a }: { a: Activity }) {
  const [showSolution, setShowSolution] = useState(false);
  return (
    <div style={{ animation: "slideIn 0.3s ease-out" }}>
      <div style={{ background: "rgba(245,158,11,.15)", borderRadius: 6, padding: "3px 12px", display: "inline-block", marginBottom: 20, fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: ".06em" }}>
        Scenario {a.nceaLevel ? `· ${a.nceaLevel}` : ""}
      </div>
      <h2 style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.3rem)", color: "#fff", marginBottom: 20 }}>{a.title}</h2>
      <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 14, padding: "20px", marginBottom: 16, border: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8b9dc3", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Setup</div>
        <p style={{ color: T.text3, fontSize: "0.9rem", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{a.setup}</p>
      </div>
      <div style={{ background: "rgba(59,130,246,.08)", borderRadius: 14, padding: "20px", marginBottom: 16, border: "1px solid rgba(59,130,246,.2)" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Your Challenge</div>
        <p style={{ color: T.text3, fontSize: "0.9rem", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{a.challenge}</p>
      </div>
      {(a.hints ?? []).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {a.hints!.map((h, i) => (
            <div key={i} style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 6, fontSize: "0.82rem", color: "#fde68a" }}>
              Hint: {h}
            </div>
          ))}
        </div>
      )}
      {a.solution && (
        <button onClick={() => setShowSolution(s => !s)} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 20px", color: "#8b9dc3", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: FONT, marginBottom: 12 }}>
          {showSolution ? "Hide Solution" : "Show Solution"}
        </button>
      )}
      {showSolution && a.solution && (
        <div style={{ background: "rgba(118,173,37,.08)", border: "1px solid rgba(118,173,37,.2)", borderRadius: 14, padding: "20px", animation: "fadeIn 0.3s ease" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#76AD25", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Worked Solution</div>
          <p style={{ color: T.text3, fontSize: "0.875rem", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{a.solution}</p>
        </div>
      )}
    </div>
  );
}

// ── REFLECTION ────────────────────────────────────────────────────────────
function ReflectionActivity({ a }: { a: Activity }) {
  const [text, setText] = useState("");
  return (
    <div style={{ animation: "slideIn 0.3s ease-out" }}>
      <div style={{ background: "rgba(239,68,68,.12)", borderRadius: 6, padding: "3px 12px", display: "inline-block", marginBottom: 20, fontSize: "0.72rem", fontWeight: 700, color: "#fca5a5", textTransform: "uppercase", letterSpacing: ".06em" }}>
        Reflection
      </div>
      <h2 style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.3rem)", color: "#fff", marginBottom: 20 }}>{a.title}</h2>
      <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 14, padding: "20px", marginBottom: 20, border: "1px solid rgba(255,255,255,.08)" }}>
        <p style={{ color: T.text3, fontSize: "0.9rem", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{a.prompt}</p>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write your thoughts here..." rows={5} style={{ width: "100%", background: "rgba(255,255,255,.06)", border: "1.5px solid rgba(255,255,255,.12)", borderRadius: 12, padding: "16px", color: "#fff", fontFamily: FONT, fontSize: "0.9rem", resize: "vertical", outline: "none" }} onFocus={e => e.target.style.borderColor = "#76AD25"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.12)"} />
      {a.nceaLink && <p style={{ fontSize: "0.78rem", color: "#8b9dc3", marginTop: 10, fontStyle: "italic" }}>{a.nceaLink}</p>}
    </div>
  );
}

// ── DISCUSSION ────────────────────────────────────────────────────────────
function DiscussionActivity({ a }: { a: Activity }) {
  return (
    <div style={{ animation: "slideIn 0.3s ease-out" }}>
      <div style={{ background: "rgba(14,165,233,.12)", borderRadius: 6, padding: "3px 12px", display: "inline-block", marginBottom: 20, fontSize: "0.72rem", fontWeight: 700, color: "#7dd3fc", textTransform: "uppercase", letterSpacing: ".06em" }}>
        Group Discussion
      </div>
      <h2 style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.3rem)", color: "#fff", marginBottom: 20 }}>{a.title ?? "Discussion"}</h2>
      <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 14, padding: "22px", marginBottom: 20, border: "1px solid rgba(255,255,255,.08)" }}>
        <p style={{ color: "#e2e8f0", fontSize: "1rem", lineHeight: 1.75, fontWeight: 600 }}>{a.prompt}</p>
      </div>
      {(a.guidingQuestions ?? []).length > 0 && (
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8b9dc3", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Guiding Questions</div>
          {a.guidingQuestions!.map((q, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <span style={{ color: "#7dd3fc", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <p style={{ color: T.text3, fontSize: "0.875rem", lineHeight: 1.6 }}>{q}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── COMPLETION SCREEN ─────────────────────────────────────────────────────
function CompletionScreen({ lesson, onContinue, onReview }: {
  lesson: LessonData;
  onContinue: () => void;
  onReview: () => void;
}) {
  const { state } = useGame();
  const [showContent, setShowContent] = useState(false);
  useEffect(() => { setTimeout(() => setShowContent(true), 300); }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0a1628 0%, #0d1f1a 50%, #0a1628 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2rem", textAlign: "center",
    }}>
      <Confetti active />

      <div style={{ opacity: showContent ? 1 : 0, transform: showContent ? "translateY(0)" : "translateY(30px)", transition: "all 0.5s ease", maxWidth: 480, width: "100%" }}>

        {/* Trophy */}
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg, #76AD25, #3d8500)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 0 40px rgba(118,173,37,.4)" }}>
          <Check size={48} color="#fff" strokeWidth={3} />
        </div>

        <div style={{ fontSize: "0.875rem", color: "#76AD25", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
          Lesson Complete
        </div>
        <h1 style={{ fontWeight: 900, fontSize: "2rem", color: "#fff", marginBottom: 6, lineHeight: 1.2 }}>
          {lesson.title}
        </h1>
        <p style={{ color: "#8b9dc3", fontSize: "0.9rem", marginBottom: 36 }}>{lesson.nceaFocus}</p>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 36, flexWrap: "wrap" }}>
          <div style={{ background: "rgba(118,173,37,.15)", border: "1px solid rgba(118,173,37,.3)", borderRadius: 14, padding: "16px 24px", minWidth: 100 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
              <Zap size={16} color="#76AD25" />
              <span style={{ fontSize: "0.75rem", color: "#76AD25", fontWeight: 700 }}>XP EARNED</span>
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fff" }}>
              +<XPCounter target={lesson.xpReward} />
            </div>
          </div>

          <div style={{ background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 14, padding: "16px 24px", minWidth: 100 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
              <Flame size={16} color="#f59e0b" />
              <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 700 }}>STREAK</span>
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fff" }}>
              {state?.streak ?? 1}
            </div>
          </div>

          <div style={{ background: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.3)", borderRadius: 14, padding: "16px 24px", minWidth: 100 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
              <BookOpen size={16} color="#3B82F6" />
              <span style={{ fontSize: "0.75rem", color: "#3B82F6", fontWeight: 700 }}>LESSONS</span>
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fff" }}>
              {(state?.completedLessons as string[] ?? []).length}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onContinue} style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 32px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "1rem", cursor: "pointer", fontFamily: FONT, boxShadow: "0 4px 20px rgba(118,173,37,.4)" }}>
            Continue <ArrowRight size={18} />
          </button>
          <button onClick={onReview} style={{ padding: "14px 24px", background: "rgba(255,255,255,.08)", color: "#8b9dc3", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", fontFamily: FONT }}>
            Review
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NO HEARTS SCREEN ──────────────────────────────────────────────────────
function NoHeartsScreen({ onRestart, onLeave }: { onRestart: () => void; onLeave: () => void }) {
  return <SadKiwiOverlay onDismiss={onRestart} onLeave={onLeave} />;
}

// ── MAIN LESSON CONTENT ────────────────────────────────────────────────────
function LessonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const folder = searchParams?.get("folder") ?? null;
  const filename = searchParams?.get("filename") ?? null;
  const { completeLesson, state } = useGame();

  const [lesson, setLesson]       = useState<LessonData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [step, setStep]           = useState(0);
  const [passedSteps, setPassedSteps] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [hearts, setHearts]       = useState(3);
  const [animKey, setAnimKey]     = useState(0);

  useEffect(() => {
    if (!folder || !filename) return;
    setLoading(true);
    fetch(`/api/lesson?folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(filename)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d.error) throw new Error(d.error);
        setLesson(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lesson load error:", err);
        setLoading(false);
      });
  }, [folder, filename]);

  const activities = lesson?.activities ?? [];
  const current = activities[step];
  const isInteractive = current && ["quiz","truefalse","dragdrop","typed"].includes(current.type);
  const stepPassed = passedSteps.has(step);
  const canNext = !isInteractive || stepPassed;
  const progress = activities.length > 0 ? (step / activities.length) * 100 : 0;

  function passStep() { setPassedSteps(s => new Set([...s, step])); }

  function loseHeart() {
    setHearts(h => Math.max(0, h - 1));
  }

  function goNext() {
    if (!canNext) return;
    if (hearts <= 0) return;
    if (step < activities.length - 1) {
      setStep(s => s + 1);
      setAnimKey(k => k + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleComplete();
    }
  }

  function handleComplete() {
    if (!lesson || !folder || !filename) return;
    completeLesson(`${folder}/${filename}`, lesson.xpReward, 50, lesson.title);
    // Check if this was the last lesson in the module — fire corner celebration
    if (lessons && lessons.length > 0) {
      const completedIds = (state?.completedLessons as string[] ?? []);
      const allDone = lessons.every((l: any) =>
        l.filename === filename || completedIds.includes(`${folder}/${l.filename}`)
      );
      if (allDone) {
        window.dispatchEvent(new CustomEvent("pw:module-complete", { detail: { folder } }));
      }
    }
    setCompleted(true);
  }

  function restart() {
    setStep(0); setPassedSteps(new Set());
    setHearts(3); setAnimKey(k => k + 1);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(118,173,37,.2)", borderTopColor: "#76AD25", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#8b9dc3", fontSize: "0.875rem" }}>Loading lesson...</p>
      </div>
    </div>
  );

  if (!lesson) return (
    <div style={{ minHeight: "100vh", background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <p style={{ color: "#8b9dc3" }}>Lesson not found.</p>
      <button onClick={() => router.push("/curriculum")} style={{ padding: "10px 20px", background: "#76AD25", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: FONT, fontWeight: 700 }}>
        Back to Curriculum
      </button>
    </div>
  );

  if (completed) return (
    <CompletionScreen
      lesson={lesson}
      onContinue={() => router.push(folder ? `/module?folder=${folder}` : "/curriculum")}
      onReview={restart}
    />
  );

  if (hearts <= 0) return (
    <NoHeartsScreen onRestart={restart} onLeave={() => router.push("/curriculum")} />
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: FONT }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(10,22,40,.95)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        padding: "0 1.5rem",
      }}>
        {/* XP Progress bar */}
        <div style={{ height: 6, background: "rgba(255,255,255,.08)", position: "relative", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg, #76AD25, #22c55e)", width: `${progress}%`, transition: "width 0.4s ease", borderRadius: "0 99px 99px 0" }} />
        </div>

        {/* Nav row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <button onClick={() => router.push("/curriculum")} style={{ display: "flex", alignItems: "center", gap: 5, color: "#8b9dc3", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", fontFamily: FONT, padding: 0 }}>
            <ChevronLeft size={18} />
          </button>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Zap size={14} color="#f59e0b" />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f59e0b" }}>{lesson.xpReward} XP</span>
            </div>
            <span style={{ color: "#2a3a5c" }}>·</span>
            <span style={{ fontSize: "0.78rem", color: "#8b9dc3" }}>{step + 1}/{activities.length}</span>
          </div>

          <HeartsBar hearts={hearts} />
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 1.5rem 120px" }}>
        <div key={animKey}>
          {current?.type === "slide"      && <SlideActivity a={current} />}
          {current?.type === "quiz"       && <QuizActivity a={current} onPass={passStep} onWrong={loseHeart} />}
          {current?.type === "truefalse"  && <TrueFalseActivity a={current} onPass={passStep} onWrong={loseHeart} />}
          {current?.type === "dragdrop"   && <DragDropActivity a={current} onPass={passStep} onWrong={loseHeart} />}
          {current?.type === "typed"      && <TypedActivity a={current} onPass={passStep} onWrong={loseHeart} />}
          {current?.type === "vocabulary" && <VocabActivity a={current} vocab={lesson.vocabulary} />}
          {current?.type === "scenario"   && <ScenarioActivity a={current} />}
          {current?.type === "reflection" && <ReflectionActivity a={current} />}
          {current?.type === "discussion" && <DiscussionActivity a={current} />}
        </div>
      </div>

      {/* Bottom nav bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,22,40,.97)", backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(255,255,255,.06)",
        padding: "16px 1.5rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 40,
      }}>
        <button
          onClick={() => { if (step > 0) { setStep(s => s - 1); setAnimKey(k => k + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
          disabled={step === 0}
          style={{ padding: "12px 20px", background: "rgba(255,255,255,.07)", color: step === 0 ? "#2a3a5c" : "#8b9dc3", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, fontWeight: 600, fontSize: "0.875rem", cursor: step === 0 ? "not-allowed" : "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 6 }}>
          <ChevronLeft size={16} /> Back
        </button>

        <button
          onClick={goNext}
          disabled={!canNext}
          className={canNext ? "btn-3d-green" : ""}
          style={{
            padding: "14px 36px",
            background: canNext ? undefined : "rgba(255,255,255,.06)",
            color: canNext ? undefined : "#2a3a5c",
            border: "none", borderRadius: 12,
            fontWeight: 800, fontSize: "0.95rem",
            cursor: canNext ? "pointer" : "not-allowed",
            fontFamily: FONT,
            display: "flex", alignItems: "center", gap: 8,
            transition: "all .2s",
            minWidth: 140, justifyContent: "center",
          }}>
          {step === activities.length - 1
            ? <><Check size={18} /> Complete</>
            : <>Next <ChevronRight size={16} /></>
          }
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

export default function LessonPage() {
  const { isDark } = useTheme();
  const T = {
    bg:      isDark ? "#0d1526" : "#f0f4f8",
    bg2:     isDark ? "#111c30" : "#ffffff",
    bg3:     isDark ? "#1a2540" : "#f8fafc",
    text:    isDark ? "#ffffff" : "#0d1526",
    text2:   isDark ? "#8b9dc3" : "#475569",
    text3:   isDark ? "#4a6a8a" : "#94a3b8",
    border:  isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)",
    border2: isDark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.16)",
    card:    isDark ? "#111c30" : "#ffffff",
    input:   isDark ? "rgba(255,255,255,.06)" : "#f8fafc",
    inputBorder: isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.14)",
    shadow:  isDark ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.08)",
    green:   isDark ? "#76AD25" : "#5a9a1a",
    accent:  isDark ? "#f59e0b" : "#d97706",
    strip:   isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
  };

  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#8b9dc3" }}>Loading...</div>
      </div>
    }>
      <LessonContent />
    </Suspense>
  );
}
