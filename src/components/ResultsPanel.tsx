import { useState, useCallback, useMemo } from "react";
import type { ReactElement } from "react";
import type { TaskMode } from "../types";
import type { Strings } from "../hooks/useLanguage";

// ── Word-repetition analysis ─────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','and','but','or','in','on','at','to',
  'of','for','with','that','this','it','as','by','from',
]);

function getRepeatedWords(text: string): Map<string, number> {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) ?? [];
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length < 3 || STOP_WORDS.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  freq.forEach((n, w) => { if (n < 3) freq.delete(w); });
  return freq;
}

// Injects <mark> spans into text nodes only — never inside HTML tags/attributes
function injectRepetitionMarks(html: string, repeated: Map<string, number>): string {
  if (repeated.size === 0) return html;
  // Split into alternating [textNode, tag, textNode, tag, ...]
  const parts = html.split(/(<[^>]*>)/);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part; // it's an HTML tag — leave untouched
    let text = part;
    repeated.forEach((count, word) => {
      const safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(
        new RegExp(`\\b(${safe})\\b`, 'gi'),
        `<mark class="word-rep" title="Used ${count} times — consider varying your vocabulary">$1</mark>`,
      );
    });
    return text;
  }).join('');
}

const CRITERIA = [
  { key: "ta",  label: "Task Achievement",             color: "#E8736A", darkerShadow: "rgba(180,72,62,0.35)" },
  { key: "cc",  label: "Coherence & Cohesion",         color: "#8B7EC8", darkerShadow: "rgba(100,88,170,0.35)" },
  { key: "lr",  label: "Lexical Resource",             color: "#6BAF8A", darkerShadow: "rgba(70,145,100,0.35)" },
  { key: "gra", label: "Grammatical Range & Accuracy", color: "#D4A843", darkerShadow: "rgba(180,130,40,0.35)" },
];

// Consistent SVG icon set — 15×15, 1.4px stroke, all white
function IconTarget() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="6.5" stroke="white" strokeWidth="1.4"/>
      <circle cx="7.5" cy="7.5" r="3" stroke="white" strokeWidth="1.4"/>
      <circle cx="7.5" cy="7.5" r="1" fill="white"/>
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M5.5 9.5a3.5 3.5 0 0 0 4.95 0l1.5-1.5a3.5 3.5 0 0 0-4.95-4.95l-.88.88" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M9.5 5.5a3.5 3.5 0 0 0-4.95 0l-1.5 1.5a3.5 3.5 0 0 0 4.95 4.95l.88-.88" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M3 2.5A1.5 1.5 0 0 1 4.5 1H12v13H4.5A1.5 1.5 0 0 1 3 12.5v-10z" stroke="white" strokeWidth="1.4"/>
      <path d="M3 11h9" stroke="white" strokeWidth="1.4"/>
      <path d="M6 4.5h3M6 7h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function IconPen() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M10.5 2.5l2 2-7.5 7.5H3.5v-2l7.5-7.5z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.5 12.5h8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

const CRITERION_ICONS: Record<string, ReactElement> = {
  ta:  <IconTarget />,
  cc:  <IconLink />,
  lr:  <IconBook />,
  gra: <IconPen />,
};

function BandBar({ score }: { score: number }) {
  return (
    <div
      className="band-bar-track"
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={9}
      aria-label={`Score ${score} out of 9`}
    >
      <div className="band-bar-fill" style={{ width: `${(score / 9) * 100}%` }} />
    </div>
  );
}

// Overall score band color (semantic: green/amber/red)
function overallColor(score: number) {
  if (score >= 7) return "#4A7C59";
  if (score >= 5.5) return "#8A6E3E";
  return "#A04040";
}

interface Props {
  result: any;
  taskMode: TaskMode;
  loading: boolean;
  essay: string;
  s: Pick<Strings, "loadingText" | "overallTitle" | "overallSubtitleT1" | "overallSubtitleT2" | "summaryTitle" | "errorsTitle">;
  onImprove: () => void;
  improvedEssay: string | null;
  loadingImprove: boolean;
}

export function ResultsPanel({ result, taskMode, loading, essay, s, onImprove, improvedEssay, loadingImprove }: Props) {
  const [copied, setCopied] = useState(false);

  const repeatedWords = useMemo(
    () => (result && essay ? getRepeatedWords(essay) : new Map<string, number>()),
    [result, essay],
  );

  const processedAnnotated = useMemo(
    () => (result?.annotated ? injectRepetitionMarks(result.annotated, repeatedWords) : ''),
    [result?.annotated, repeatedWords],
  );

  const handleCopy = useCallback(() => {
    if (!improvedEssay) return;
    navigator.clipboard.writeText(improvedEssay).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [improvedEssay]);
  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "52px 24px" }} aria-live="polite" aria-busy="true">
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #E8E4DE",
            borderTopColor: "var(--sage)",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 0.7s linear infinite",
          }}
          aria-hidden="true"
        />
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>
          {s.loadingText}
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-live="polite">

      {/* ── Overall Band Score — animates first ── */}
      <div
        className="card anim-item"
        style={{ padding: "28px 28px 24px", animationDelay: "0ms" }}
      >
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
              color: overallColor(result.overall),
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
        <div style={{ marginTop: 20, height: 4, borderRadius: 999, background: "#EDE9E3", overflow: "hidden" }}>
          <div style={{
            width: `${(result.overall / 9) * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: overallColor(result.overall),
            transition: "width 0.7s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
      </div>

      {/* ── Criteria Grid — staggered 100ms apart ── */}
      <div className="criteria-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {CRITERIA.map((c, i) => (
          <div
            key={c.key}
            className="criterion-card anim-item"
            style={{
              background: c.color,
              boxShadow: `0 4px 16px ${c.darkerShadow}`,
              animationDelay: `${(i + 1) * 100}ms`,
            }}
          >
            {/* Header: icon + label left, score right */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 2 }}>
                {CRITERION_ICONS[c.key]}
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: "'Nunito', system-ui, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.3,
                }}>
                  {c.label}
                </span>
              </div>
              <span style={{
                fontFamily: "'Nunito', system-ui, sans-serif",
                fontSize: 32,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
                letterSpacing: -1,
                flexShrink: 0,
              }}>
                {result[c.key]}
              </span>
            </div>

            <BandBar score={result[c.key]} />

            <p style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.65,
              margin: "10px 0 0",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {result[c.key + "_comment"]}
            </p>
          </div>
        ))}
      </div>

      {/* ── Summary — after criteria ── */}
      <div className="card anim-item" style={{ padding: "20px 22px", animationDelay: "500ms" }}>
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

      {/* ── Annotated Essay ── */}
      <div className="card anim-item" style={{ overflow: "hidden", padding: 0, animationDelay: "580ms" }}>
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
          dangerouslySetInnerHTML={{ __html: processedAnnotated }}
        />

        {/* ── Legend ── */}
        <div style={{
          padding: "10px 22px 12px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: "#FAFAF8",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <span style={{
              display: "inline-block",
              width: 24,
              height: 3,
              borderRadius: 2,
              background: "#ef4444",
              textDecoration: "underline wavy #ef4444",
              flexShrink: 0,
            }} aria-hidden="true" />
            Grammar &amp; vocabulary errors
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <span style={{
              display: "inline-block",
              width: 24,
              height: 14,
              borderRadius: 3,
              background: "rgba(245,200,66,0.28)",
              borderBottom: "1.5px solid #D4A800",
              flexShrink: 0,
            }} aria-hidden="true" />
            Repeated words (3+ times)
          </div>
        </div>
      </div>

      {/* ── Improve My Essay button ── */}
      {!improvedEssay && (
        <div className="anim-item" style={{ animationDelay: "640ms" }}>
          <button
            className="btn-secondary"
            onClick={onImprove}
            disabled={loadingImprove}
            aria-busy={loadingImprove}
          >
            {loadingImprove ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid var(--sage-mid)",
                    borderTopColor: "var(--sage)",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
                Improving...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M3.05 3.05l1.42 1.42M10.53 10.53l1.42 1.42M3.05 11.95l1.42-1.42M10.53 4.47l1.42-1.42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
                Improve My Essay
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Improved Version card ── */}
      {improvedEssay && (
        <div
          className="card anim-item"
          style={{ overflow: "hidden", padding: 0, animationDelay: "0ms" }}
        >
          {/* Card header */}
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--sage-light)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--sage)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1l1.5 3 3.3.5-2.4 2.3.6 3.2L7 8.5 4 10l.6-3.2L2.2 4.5l3.3-.5z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: 800, fontSize: 14, color: "var(--sage-dark)" }}>
                Improved Version
              </span>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              aria-label={copied ? "Copied to clipboard" : "Copy improved essay"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${copied ? "var(--sage-mid)" : "var(--border)"}`,
                background: copied ? "var(--sage-light)" : "#fff",
                color: copied ? "var(--sage-dark)" : "var(--text-muted)",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Nunito', system-ui, sans-serif",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: 32,
                whiteSpace: "nowrap",
              }}
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M8 4V2.5A1.5 1.5 0 0 0 6.5 1h-4A1.5 1.5 0 0 0 1 2.5v4A1.5 1.5 0 0 0 2.5 8H4" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Essay text */}
          <div style={{
            padding: "22px 24px",
            background: "#fff",
            fontSize: 14,
            lineHeight: 1.9,
            color: "var(--text-primary)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            whiteSpace: "pre-wrap",
          }}>
            {improvedEssay}
          </div>
        </div>
      )}
    </div>
  );
}
