"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { useGame } from "@/lib/gameContext";
import { ChevronLeft, ChevronRight, Zap, Check } from "lucide-react";


type Activity = {
  type: "slide" | "quiz" | "truefalse" | "dragdrop" | "typed" | "vocabulary" | "scenario" | "reflection" | "discussion";
  title?: string;
  statement?: string;
  question?: string;
  content?: string;
  prompt?: string;
  estimatedMinutes?: number;
  nceaLevel?: string;
  // quiz
  questions?: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  // truefalse
  correctAnswer?: boolean;
  explanation?: string;
  // dragdrop
  pairs?: { item: string; zone: string }[];
  // typed
  acceptedAnswers?: string[];
  placeholder?: string;
  hint?: string;
  // scenario
  setup?: string;
  challenge?: string;
  hints?: string[];
  solution?: string;
  // discussion
  guidingQuestions?: string[];
  nceaLink?: string;
};

type LessonData = {
  title: string;
  order: number;
  xpReward: number;
  bloomsLevel: string;
  nceaFocus: string;
  objectives: string[];
  vocabulary: { term: string; definition: string }[];
  activities: Activity[];
};

// ---- Activity renderers ----

function SlideActivity({ a }: { a: Activity }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "28px" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#3B82F6", background: "#eff6ff", padding: "3px 10px", borderRadius: 99, display: "inline-block", marginBottom: 16 }}>
        Reading
      </div>
      <h2 style={{ fontWeight: 800, fontSize: "1.15rem", color: "#0d1526", marginBottom: 16, lineHeight: 1.3 }}>{a.title}</h2>
      <div style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{a.content}</div>
    </div>
  );
}

function QuizActivity({ a, onPass }: { a: Activity; onPass: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [locked, setLocked] = useState<Record<number, boolean>>({});
  const questions = a.questions ?? [];

  function answer(qi: number, oi: number, correct: number) {
    if (locked[qi]) return;
    const attempt = (attempts[qi] ?? 0) + 1;
    setAttempts(p => ({ ...p, [qi]: attempt }));
    setAnswers(p => ({ ...p, [qi]: oi }));
    if (oi === correct) {
      setLocked(p => ({ ...p, [qi]: true }));
    } else if (attempt >= 2) {
      setLocked(p => ({ ...p, [qi]: true }));
    }
    // Check all done
    const newAnswers = { ...answers, [qi]: oi };
    const allDone = questions.every((q, i) => {
      const a2 = i === qi ? oi : newAnswers[i];
      const att = i === qi ? attempt : (attempts[i] ?? 0);
      return a2 === q.correctIndex || att >= 2;
    });
    if (allDone) setTimeout(onPass, 400);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#76AD25", background: "#e8f5d0", padding: "3px 10px", borderRadius: 99 }}>
          Quiz
        </div>
        {a.nceaLevel && <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 500 }}>{a.nceaLevel}</span>}
      </div>
      {questions.map((q, qi) => {
        const chosen = answers[qi];
        const isLocked = locked[qi];
        return (
          <div key={qi} style={{ marginBottom: qi < questions.length - 1 ? 24 : 0 }}>
            <p style={{ fontWeight: 600, fontSize: "0.925rem", color: "#0d1526", marginBottom: 12, lineHeight: 1.5 }}>{q.question}</p>
            {q.options.map((opt, oi) => {
              let bg = "#f8fafc", border = "#e2e8f0", color = "#475569";
              if (isLocked) {
                if (oi === q.correctIndex) { bg = "#e8f5d0"; border = "#76AD25"; color = "#3d5a12"; }
                else if (oi === chosen && chosen !== q.correctIndex) { bg = "#fef2f2"; border = "#EF4444"; color = "#991b1b"; }
              }
              return (
                <div key={oi} onClick={() => answer(qi, oi, q.correctIndex)} style={{
                  padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${border}`,
                  background: bg, color, cursor: isLocked ? "default" : "pointer",
                  marginBottom: 8, fontSize: "0.875rem", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 10, transition: "all .1s",
                }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: isLocked && oi === q.correctIndex ? "#76AD25" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: isLocked && oi === q.correctIndex ? "#fff" : "#64748b", flexShrink: 0 }}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </div>
              );
            })}
            {isLocked && (
              <div style={{ background: chosen === q.correctIndex ? "#e8f5d0" : "#fef2f2", border: `1px solid ${chosen === q.correctIndex ? "#76AD25" : "#EF4444"}`, borderRadius: 8, padding: "10px 14px", fontSize: "0.8rem", color: chosen === q.correctIndex ? "#3d5a12" : "#991b1b", marginTop: 8, lineHeight: 1.5 }}>
                {chosen === q.correctIndex ? "Correct. " : `The answer is ${String.fromCharCode(65 + q.correctIndex)}. `}
                {q.explanation}
              </div>
            )}
            {!isLocked && attempts[qi] > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #EF4444", borderRadius: 8, padding: "8px 14px", fontSize: "0.8rem", color: "#991b1b", marginTop: 8 }}>
                Not quite. {attempts[qi] >= 2 ? "Moving on." : "Try again."}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TrueFalseActivity({ a, onPass }: { a: Activity; onPass: () => void }) {
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const correct = a.correctAnswer === true || a.correctAnswer === "true" as any;

  function answer(val: boolean) {
    if (locked) return;
    const att = attempts + 1;
    setAttempts(att);
    setChosen(val);
    if (val === correct) { setLocked(true); setTimeout(onPass, 400); }
    else if (att >= 2) { setLocked(true); setTimeout(onPass, 800); }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "28px" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#f59e0b", background: "#fef3c7", padding: "3px 10px", borderRadius: 99, display: "inline-block", marginBottom: 20 }}>
        True or False
      </div>
      <p style={{ fontWeight: 600, fontSize: "1rem", color: "#0d1526", marginBottom: 24, lineHeight: 1.6 }}>{a.statement}</p>
      <div style={{ display: "flex", gap: 12 }}>
        {[true, false].map(val => {
          let bg = "#f8fafc", border = "#e2e8f0", color = "#475569";
          if (locked) {
            if (val === correct) { bg = "#e8f5d0"; border = "#76AD25"; color = "#3d5a12"; }
            else if (val === chosen && chosen !== correct) { bg = "#fef2f2"; border = "#EF4444"; color = "#991b1b"; }
          }
          return (
            <button key={String(val)} onClick={() => answer(val)} style={{
              flex: 1, padding: "16px", borderRadius: 12,
              border: `2px solid ${border}`, background: bg, color,
              fontWeight: 700, fontSize: "1rem", cursor: locked ? "default" : "pointer",
              fontFamily: "Inter, sans-serif", transition: "all .15s",
            }}>
              {val ? "True" : "False"}
            </button>
          );
        })}
      </div>
      {locked && (
        <div style={{ background: chosen === correct ? "#e8f5d0" : "#fef2f2", border: `1px solid ${chosen === correct ? "#76AD25" : "#EF4444"}`, borderRadius: 8, padding: "12px 16px", fontSize: "0.85rem", color: chosen === correct ? "#3d5a12" : "#991b1b", marginTop: 16, lineHeight: 1.5 }}>
          {chosen === correct ? "Correct. " : `The answer is ${correct ? "True" : "False"}. `}
          {a.explanation}
        </div>
      )}
    </div>
  );
}

function DragDropActivity({ a, onPass }: { a: Activity; onPass: () => void }) {
  const pairs = a.pairs ?? [];
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [passed, setPassed] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  const placedItems = Object.keys(placements);
  const unplaced = pairs.map(p => p.item).filter(i => !placedItems.includes(i));

  function check() {
    const att = attempts + 1;
    setAttempts(att);
    setChecked(true);
    const allCorrect = pairs.every(p => placements[p.item] === p.zone);
    if (allCorrect) { setPassed(true); setTimeout(onPass, 500); }
    else if (att >= 2) { setTimeout(onPass, 1000); }
  }

  function reset() { setPlacements({}); setChecked(false); }

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#a78bfa", background: "#f5f3ff", padding: "3px 10px", borderRadius: 99, display: "inline-block", marginBottom: 16 }}>
        Drag and Drop
      </div>
      <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0d1526", marginBottom: 16 }}>{a.title}</h3>

      {/* Pool */}
      <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: 10, padding: "12px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8, minHeight: 52 }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (dragging) { setPlacements(p => { const n = {...p}; delete n[dragging]; return n; }); setDragging(null); } }}>
        {unplaced.map(item => (
          <div key={item} draggable onDragStart={() => setDragging(item)} style={{ padding: "6px 14px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: "0.8rem", fontWeight: 600, cursor: "grab", color: "#0d1526" }}>
            {item}
          </div>
        ))}
        {unplaced.length === 0 && <span style={{ fontSize: "0.78rem", color: "#94a3b8", alignSelf: "center" }}>All items placed</span>}
      </div>

      {/* Zones */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {[...new Set(pairs.map(p => p.zone))].map(zone => {
          const itemsHere = pairs.filter(p => placements[p.item] === zone).map(p => p.item);
          let zoneBorder = "#e2e8f0", zoneBg = "#f8fafc";
          if (checked) {
            const allCorrect = itemsHere.every(item => pairs.find(p => p.item === item)?.zone === zone);
            if (itemsHere.length > 0 && allCorrect) { zoneBorder = "#76AD25"; zoneBg = "#e8f5d0"; }
            else if (itemsHere.length > 0) { zoneBorder = "#EF4444"; zoneBg = "#fef2f2"; }
          }
          return (
            <div key={zone} style={{ border: `2px dashed ${zoneBorder}`, background: zoneBg, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, minHeight: 48 }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragging) { setPlacements(p => ({ ...p, [dragging]: zone })); setDragging(null); } }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", minWidth: 100 }}>{zone}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {itemsHere.map(item => (
                  <div key={item} draggable={!checked} onDragStart={() => setDragging(item)} style={{ padding: "4px 12px", background: "#fff", border: "1.5px solid #cbd5e1", borderRadius: 6, fontSize: "0.78rem", fontWeight: 600, cursor: checked ? "default" : "grab", color: "#0d1526" }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!checked ? (
        <button onClick={check} disabled={Object.keys(placements).length < pairs.length} style={{ width: "100%", padding: "11px", background: Object.keys(placements).length < pairs.length ? "#f1f5f9" : "#0d1526", color: Object.keys(placements).length < pairs.length ? "#94a3b8" : "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: "0.875rem", cursor: Object.keys(placements).length < pairs.length ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif" }}>
          Check Answer
        </button>
      ) : passed ? (
        <div style={{ background: "#e8f5d0", border: "1px solid #76AD25", borderRadius: 9, padding: "12px 16px", fontSize: "0.85rem", color: "#3d5a12", textAlign: "center", fontWeight: 600 }}>
          All correct! {a.explanation}
        </div>
      ) : attempts >= 2 ? (
        <div style={{ background: "#fef2f2", border: "1px solid #EF4444", borderRadius: 9, padding: "12px 16px", fontSize: "0.85rem", color: "#991b1b" }}>
          Some items were incorrect. {a.explanation}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: "#fef2f2", border: "1px solid #EF4444", borderRadius: 9, padding: "10px 14px", fontSize: "0.82rem", color: "#991b1b" }}>
            Some items are in the wrong place. Try again.
          </div>
          <button onClick={reset} style={{ padding: "10px 16px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 9, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "Inter, sans-serif", color: "#475569" }}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

function TypedActivity({ a, onPass }: { a: Activity; onPass: () => void }) {
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [state, setState] = useState<"idle" | "correct" | "wrong" | "locked">("idle");

  function submit() {
    if (state === "correct" || state === "locked") return;
    const att = attempts + 1;
    setAttempts(att);
    const accepted = (a.acceptedAnswers ?? []).map(x => x.toLowerCase().trim());
    if (accepted.includes(value.toLowerCase().trim())) {
      setState("correct");
      setTimeout(onPass, 500);
    } else if (att >= 2) {
      setState("locked");
      setTimeout(onPass, 1000);
    } else {
      setState("wrong");
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "28px" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#0891b2", background: "#ecfeff", padding: "3px 10px", borderRadius: 99, display: "inline-block", marginBottom: 20 }}>
        Type Your Answer
      </div>
      <p style={{ fontWeight: 600, fontSize: "0.975rem", color: "#0d1526", marginBottom: 20, lineHeight: 1.6 }}>{a.question}</p>
      {a.hint && state !== "correct" && <p style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic", marginBottom: 12 }}>Hint: {a.hint}</p>}
      <input
        type="text" value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        disabled={state === "correct" || state === "locked"}
        placeholder={a.placeholder ?? "Type your answer..."}
        style={{
          width: "100%", padding: "12px 16px", borderRadius: 10,
          border: `2px solid ${state === "correct" ? "#76AD25" : state === "wrong" || state === "locked" ? "#EF4444" : "#e2e8f0"}`,
          background: state === "correct" ? "#e8f5d0" : state === "locked" ? "#fef2f2" : "#fff",
          fontSize: "0.95rem", fontFamily: "Inter, sans-serif", outline: "none", marginBottom: 12,
          color: "#0d1526",
        }}
      />
      {state === "idle" || state === "wrong" ? (
        <button onClick={submit} disabled={!value.trim()} style={{ padding: "10px 24px", background: value.trim() ? "#0d1526" : "#f1f5f9", color: value.trim() ? "#fff" : "#94a3b8", border: "none", borderRadius: 9, fontWeight: 700, fontSize: "0.875rem", cursor: value.trim() ? "pointer" : "not-allowed", fontFamily: "Inter, sans-serif" }}>
          Submit
        </button>
      ) : null}
      {state === "wrong" && <div style={{ background: "#fef2f2", border: "1px solid #EF4444", borderRadius: 8, padding: "8px 14px", fontSize: "0.8rem", color: "#991b1b", marginTop: 10 }}>Not quite. Try again.</div>}
      {state === "correct" && <div style={{ background: "#e8f5d0", border: "1px solid #76AD25", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", color: "#3d5a12", marginTop: 10 }}>Correct! {a.explanation}</div>}
      {state === "locked" && <div style={{ background: "#fef2f2", border: "1px solid #EF4444", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", color: "#991b1b", marginTop: 10 }}>The answer is: {(a.acceptedAnswers ?? [])[0]}. {a.explanation}</div>}
    </div>
  );
}

function VocabActivity({ a, vocab }: { a: Activity; vocab: { term: string; definition: string }[] }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#a78bfa", background: "#f5f3ff", padding: "3px 10px", borderRadius: 99, display: "inline-block", marginBottom: 16 }}>
        Key Terms
      </div>
      <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0d1526", marginBottom: 16 }}>{a.title}</h3>
      {vocab.map((v, i) => (
        <div key={i} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: i < vocab.length - 1 ? "1px solid #f1f5f9" : "none" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0d1526", minWidth: 140, flexShrink: 0 }}>{v.term}</div>
          <div style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.6 }}>{v.definition}</div>
        </div>
      ))}
    </div>
  );
}

function ScenarioActivity({ a }: { a: Activity }) {
  const [showSolution, setShowSolution] = useState(false);
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#f59e0b", background: "#fef3c7", padding: "3px 10px", borderRadius: 99, display: "inline-block", marginBottom: 16 }}>
        Scenario · {a.nceaLevel}
      </div>
      <h3 style={{ fontWeight: 700, fontSize: "0.975rem", color: "#0d1526", marginBottom: 16 }}>{a.title}</h3>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", letterSpacing: ".05em", marginBottom: 8 }}>Setup</div>
        <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{a.setup}</p>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", letterSpacing: ".05em", marginBottom: 8 }}>Your Challenge</div>
        <p style={{ fontSize: "0.875rem", color: "#0d1526", lineHeight: 1.7, fontWeight: 500, whiteSpace: "pre-wrap" }}>{a.challenge}</p>
      </div>
      {(a.hints ?? []).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {(a.hints ?? []).map((h, i) => (
            <div key={i} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 14px", fontSize: "0.8rem", color: "#92400e", marginBottom: 6 }}>
              Hint: {h}
            </div>
          ))}
        </div>
      )}
      {a.solution && (
        <div>
          <button onClick={() => setShowSolution(s => !s)} style={{ padding: "8px 18px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "Inter, sans-serif", color: "#475569" }}>
            {showSolution ? "Hide Solution" : "Show Solution"}
          </button>
          {showSolution && (
            <div style={{ background: "#e8f5d0", border: "1px solid #76AD25", borderRadius: 10, padding: "16px", marginTop: 12, fontSize: "0.85rem", color: "#2d4a0e", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {a.solution}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReflectionActivity({ a }: { a: Activity }) {
  const [text, setText] = useState("");
  return (
    <div style={{ background: "linear-gradient(135deg, #f5f3ff, #e8f5d0)", border: "1px solid #d8b4fe", borderRadius: 14, padding: "28px" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#7c3aed", background: "rgba(124,58,237,.1)", padding: "3px 10px", borderRadius: 99, display: "inline-block", marginBottom: 16 }}>
        Reflection
      </div>
      <h3 style={{ fontWeight: 700, fontSize: "0.975rem", color: "#0d1526", marginBottom: 16 }}>{a.title}</h3>
      <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.8, marginBottom: 20, whiteSpace: "pre-wrap" }}>{a.prompt}</p>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write your response here..." rows={5} style={{ width: "100%", border: "1.5px solid #d8b4fe", borderRadius: 10, padding: "12px 16px", fontSize: "0.875rem", fontFamily: "Inter, sans-serif", resize: "vertical", outline: "none", background: "rgba(255,255,255,.8)", color: "#0d1526", lineHeight: 1.6 }} />
      {a.nceaLink && <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 10, fontStyle: "italic" }}>{a.nceaLink}</p>}
    </div>
  );
}

function DiscussionActivity({ a }: { a: Activity }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "28px" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#0891b2", background: "#ecfeff", padding: "3px 10px", borderRadius: 99, display: "inline-block", marginBottom: 16 }}>
        Class Discussion
      </div>
      <h3 style={{ fontWeight: 700, fontSize: "0.975rem", color: "#0d1526", marginBottom: 16 }}>{a.title}</h3>
      <p style={{ fontSize: "0.9rem", color: "#0d1526", lineHeight: 1.7, fontWeight: 600, marginBottom: 16 }}>{a.prompt}</p>
      {(a.guidingQuestions ?? []).map((q, i) => (
        <div key={i} style={{ padding: "8px 0", paddingLeft: 16, fontSize: "0.875rem", color: "#475569", lineHeight: 1.6, borderLeft: "3px solid #0891b2", marginBottom: 8 }}>
          {q}
        </div>
      ))}
    </div>
  );
}

// ---- Main lesson page ----
function LessonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const folder = searchParams.get("folder");
  const filename = searchParams.get("filename");
  const { user, completeLesson, state } = useGame();
  const xp = state?.xp ?? 0;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [passedSteps, setPassedSteps] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!folder || !filename) return;
    fetch(`/api/lesson?folder=${folder}&filename=${filename}`)
      .then(r => r.json())
      .then(d => { setLesson(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [folder, filename]);

  const activities = lesson?.activities ?? [];
  const current = activities[step];
  const isInteractive = current && ["quiz","truefalse","dragdrop","typed"].includes(current.type);
  const stepPassed = passedSteps.has(step);
  const canNext = !isInteractive || stepPassed;

  function passStep() { setPassedSteps(s => new Set([...s, step])); }

  function goNext() {
    if (!canNext) return;
    if (step < activities.length - 1) { setStep(s => s + 1); window.scrollTo(0, 0); }
    else handleComplete();
  }

  function handleComplete() {
    if (!lesson || !folder || !filename) return;
    const lessonId = `${folder}/${filename}`;
    completeLesson(lessonId, lesson.xpReward);
    
    setCompleted(true);
  }

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#94a3b8" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#76AD25", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        Loading lesson...
      </div>
    </div>
  );

  if (!lesson) return (
    <div style={{ textAlign: "center", padding: "48px" }}>
      <p style={{ color: "#94a3b8" }}>Lesson not found.</p>
      <button onClick={() => router.push("/curriculum")} style={{ marginTop: 16, padding: "10px 20px", background: "#0d1526", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
        Back to Curriculum
      </button>
    </div>
  );

  if (completed) return (
    <div style={{ maxWidth: 560, margin: "48px auto", padding: "0 1.5rem", textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#e8f5d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Check size={36} color="#76AD25" />
      </div>
      <h2 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#0d1526", marginBottom: 8 }}>Lesson Complete</h2>
      <p style={{ color: "#64748b", fontSize: "0.925rem", marginBottom: 8 }}>{lesson.title}</p>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#e8f5d0", color: "#3d5a12", padding: "8px 18px", borderRadius: 9999, fontWeight: 700, marginBottom: 28 }}>
        <Zap size={16} color="#76AD25" /> +{lesson.xpReward} XP earned
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={() => router.push("/curriculum")} style={{ padding: "12px 28px", background: "#0d1526", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          Back to Curriculum
        </button>
        {step < activities.length && (
          <button onClick={() => { setCompleted(false); setStep(0); setPassedSteps(new Set()); }} style={{ padding: "12px 20px", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            Review
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 1.5rem 48px" }}>
      {/* Back */}
      <button onClick={() => router.push("/curriculum")} style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", marginBottom: 20, fontFamily: "Inter, sans-serif" }}>
        <ChevronLeft size={16} /> Back to Curriculum
      </button>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>{lesson.nceaFocus}</div>
        <h1 style={{ fontWeight: 800, fontSize: "1.35rem", color: "#0d1526", lineHeight: 1.3 }}>{lesson.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{lesson.bloomsLevel}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={13} color="#f59e0b" />
            <span style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600 }}>{lesson.xpReward} XP</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: 3, marginBottom: 24 }}>
        {activities.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < step ? "#76AD25" : i === step ? "#3B82F6" : "#e2e8f0", transition: "background .2s" }} />
        ))}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 20 }}>Step {step + 1} of {activities.length}</div>

      {/* Activity */}
      {current?.type === "slide"      && <SlideActivity a={current} />}
      {current?.type === "quiz"       && <QuizActivity a={current} onPass={passStep} />}
      {current?.type === "truefalse"  && <TrueFalseActivity a={current} onPass={passStep} />}
      {current?.type === "dragdrop"   && <DragDropActivity a={current} onPass={passStep} />}
      {current?.type === "typed"      && <TypedActivity a={current} onPass={passStep} />}
      {current?.type === "vocabulary" && <VocabActivity a={current} vocab={lesson.vocabulary} />}
      {current?.type === "scenario"   && <ScenarioActivity a={current} />}
      {current?.type === "reflection" && <ReflectionActivity a={current} />}
      {current?.type === "discussion" && <DiscussionActivity a={current} />}

      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
        <button onClick={() => { if (step > 0) { setStep(s => s - 1); window.scrollTo(0, 0); } }} disabled={step === 0} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "#f1f5f9", color: step === 0 ? "#cbd5e1" : "#475569", border: "1px solid #e2e8f0", borderRadius: 10, fontWeight: 600, fontSize: "0.875rem", cursor: step === 0 ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <button onClick={goNext} disabled={!canNext} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 24px", background: canNext ? (step === activities.length - 1 ? "#76AD25" : "#0d1526") : "#f1f5f9", color: canNext ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.875rem", cursor: canNext ? "pointer" : "not-allowed", fontFamily: "Inter, sans-serif" }}>
          {step === activities.length - 1 ? "Complete Lesson" : "Next"} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function LessonPage() {
  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", background: "#f1f5f9" }}>
        <Suspense fallback={<div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>Loading...</div>}>
          <LessonContent />
        </Suspense>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
