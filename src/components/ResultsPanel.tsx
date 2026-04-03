import type { ReactElement } from "react";
import type { TaskMode } from "../types";
import type { Strings } from "../hooks/useLanguage";

const CRITERIA = [
  { key: "ta",  label: "Task Achievement" },
  { key: "cc",  label: "Coherence & Cohesion" },
  { key: "lr",  label: "Lexical Resource" },
  { key: "gra", label: "Grammatical Range & Accuracy" },
];

// SVG icons — one per criterion
function IconTarget() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor"/>
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M5 7.5h5M8.5 5l2.5 2.5L8.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.5 10l-2.5-2.5L6.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2 3a1 1 0 0 1 1-1h4v11H3a1 1 0 0 1-1-1V3z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7 2h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H7V2z" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}
function IconPen() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M10.5 2.5l2 2-7 7H3.5v-2l7-7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.5 11.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

const CRITERION_ICONS: Record<string, ReactElement> = {
  ta:  <IconTarget />,
  cc:  <IconLink />,
  lr:  <IconBook />,
  gra: <IconPen />,
};

function bandColor(score: number) {
  if (score >= 7) return "#4A7C59";
  if (score >= 5.5) return "#8A6E3E";
  return "#A04040";
}

function BandBar({ score }: { score: number }) {
  return (
    <div className="band-bar-track" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={9} aria-label={`Score ${score} out of 9`}>
      <div className="band-bar-fill" style={{ width: `${(score / 9) * 100}%` }} />
    </div>
  );
}

interface Props {
  result: any;
  taskMode: TaskMode;
  loading: boolean;
  s: Pick<Strings, "loadingText" | "overallTitle" | "overallSubtitleT1" | "overallSubtitleT2" | "summaryTitle" | "errorsTitle">;
}

export function ResultsPanel({ result, taskMode, loading, s }: Props) {
  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "52px 24px" }} aria-live="polite" aria-busy="true">
        <div style={{
          width: 40,
          height: 40,
          border: "3px solid #E8E4DE",
          borderTopColor: "var(--sage)",
          borderRadius: "50%",
          margin: "0 auto 16px",
          animation: "spin 0.7s linear infinite",
        }} aria-hidden="true" />
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>
          {s.loadingText}
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="result-enter" style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-live="polite">

      {/* Overall Band Score */}
      <div className="card" style={{ padding: "28px 28px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>
              {s.overallTitle}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55, maxWidth: 320 }}>
              {taskMode === "task1" ? s.overallSubtitleT1 : s.overallSubtitleT2}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{
              fontFamily: "'Nunito', system-ui, sans-serif",
              fontSize: 56,
              fontWeight: 900,
              color: bandColor(result.overall),
              lineHeight: 1,
              letterSpacing: -2,
            }}>
              {result.overall}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontWeight: 600 }}>
              out of 9.0
            </div>
          </div>
        </div>

        {/* Thin overall band bar */}
        <div style={{ marginTop: 20, height: 4, borderRadius: 999, background: "#EDE9E3", overflow: "hidden" }}>
          <div style={{
            width: `${(result.overall / 9) * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: bandColor(result.overall),
            transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
      </div>

      {/* Criteria Grid */}
      <div className="criteria-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {CRITERIA.map((c) => (
          <div key={c.key} className="criterion-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--sage)" }}>
                {CRITERION_ICONS[c.key]}
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Nunito', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: 0.7, color: "var(--text-muted)" }}>
                  {c.label}
                </span>
              </div>
              <span style={{
                fontFamily: "'Nunito', system-ui, sans-serif",
                fontSize: 22,
                fontWeight: 900,
                color: bandColor(result[c.key]),
                letterSpacing: -0.5,
              }}>
                {result[c.key]}
              </span>
            </div>
            <BandBar score={result[c.key]} />
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, margin: "10px 0 0" }}>
              {result[c.key + "_comment"]}
            </p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--sage-light)",
            border: "1px solid var(--sage-mid)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--sage)",
            flexShrink: 0,
          }} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: 800, fontSize: 14, color: "var(--text-primary)" }}>
            {s.summaryTitle}
          </span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text-secondary)", margin: 0 }}>
          {result.summary}
        </p>
      </div>

      {/* Annotated Essay */}
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#FDF3F2",
            border: "1px solid var(--error-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--error)",
            flexShrink: 0,
          }} aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: 800, fontSize: 14, color: "var(--text-primary)" }}>
            {s.errorsTitle}
          </span>
        </div>
        <div
          style={{ padding: "20px 24px", background: "#fff", fontSize: 14, lineHeight: 1.9, color: "var(--text-secondary)" }}
          dangerouslySetInnerHTML={{ __html: result.annotated }}
        />
      </div>
    </div>
  );
}
