import { useState, useCallback, useMemo } from "react";
import type { ReactElement } from "react";
import type { TaskMode } from "../types";
import type { Strings, Lang } from "../hooks/useLanguage";

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

function injectRepetitionMarks(html: string, repeated: Map<string, number>): string {
  if (repeated.size === 0) return html;
  const parts = html.split(/(<[^>]*>)/);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part;
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

const CRITERIA: { key: "ta" | "cc" | "lr" | "gra"; cssVar: string; label: string }[] = [
  { key: "ta", cssVar: "--c-task", label: "Task Achievement" },
  { key: "cc", cssVar: "--c-cohesion", label: "Coherence & Cohesion" },
  { key: "lr", cssVar: "--c-lexical", label: "Lexical Resource" },
  { key: "gra", cssVar: "--c-grammar", label: "Grammatical Range & Accuracy" },
];

function IconTarget() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
      <path d="M4 19.5V21h16M8 7h8M8 11h6" />
    </svg>
  );
}
function IconPen() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
const CRIT_ICONS: Record<string, ReactElement> = {
  ta: <IconTarget />, cc: <IconLink />, lr: <IconBook />, gra: <IconPen />,
};

interface Props {
  result: any;
  taskMode: TaskMode;
  loading: boolean;
  essay: string;
  s: Pick<Strings, "loadingText" | "overallTitle" | "overallSubtitleT1" | "overallSubtitleT2" | "summaryTitle" | "errorsTitle" | "evaluationTitle" | "updatedNow" | "criteriaLabel" | "outOf" | "lineLevelFeedback" | "whereMarksWent" | "legendWord" | "legendPhrase" | "legendNote" | "improveBtn" | "improvingBtn" | "improvedTitle" | "copy" | "copied" | "repeatedWordsLegend" | "grammarLegend">;
  onImprove: () => void;
  improvedEssay: string | null;
  loadingImprove: boolean;
  lang: Lang;
}

export function ResultsPanel({ result, taskMode, essay, s, onImprove, improvedEssay, loadingImprove }: Props) {
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

  if (!result) return null;

  const overallPct = (result.overall / 9) * 100;

  return (
    <>
      <style>{`
        .results { margin-top: 40px; display: grid; gap: 20px; }

        .score-card {
          padding: 32px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          flex-wrap: wrap;
          overflow: hidden;
        }
        .score-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: radial-gradient(circle at 100% 0%, var(--accent-soft), transparent 50%);
        }
        .score-meta { position: relative; z-index: 1; flex: 1 1 320px; min-width: 0; }
        .score-meta .label { display: block; margin-bottom: 8px; }
        .score-headline {
          font-family: var(--font-display);
          font-size: 26px;
          line-height: 1.25;
          letter-spacing: -0.01em;
          margin: 2px 0 18px;
          font-weight: 400;
          color: var(--text);
          max-width: 460px;
        }
        .score-progress {
          width: 360px;
          max-width: 100%;
          height: 5px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
          margin-top: 4px;
        }
        .score-progress > span {
          position: absolute;
          inset: 0 auto 0 0;
          background: linear-gradient(90deg, var(--accent), var(--accent-text));
          border-radius: inherit;
          transition: width 0.7s cubic-bezier(.4,0,.2,1);
        }
        .score-scale {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.08em;
          width: 360px;
          max-width: 100%;
        }
        .score-big {
          position: relative;
          z-index: 1;
          font-family: var(--font-display);
          font-size: 120px;
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 400;
          color: var(--text);
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .score-big small {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          font-weight: 400;
        }

        .criteria-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .criteria {
          background: var(--bg-elev);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px 26px;
          position: relative;
          overflow: hidden;
          min-height: 240px;
          display: flex;
          flex-direction: column;
        }
        .criteria::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--c);
        }
        .criteria::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 0% 0%, color-mix(in oklab, var(--c) 18%, transparent), transparent 50%);
        }
        .criteria > * { position: relative; z-index: 1; }
        .criteria-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }
        .criteria-name {
          font-family: var(--font-label);
          font-weight: 500;
          font-size: 10.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .criteria-name .dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--c);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--c) 30%, transparent);
        }
        .criteria-icon {
          color: var(--c);
          display: inline-flex;
        }
        .criteria-score {
          font-family: var(--font-display);
          font-size: 44px;
          line-height: 1;
          letter-spacing: -0.02em;
          font-weight: 400;
          color: var(--text);
        }
        .criteria-bar {
          height: 3px;
          background: var(--bg);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 18px;
        }
        .criteria-bar > span {
          display: block;
          height: 100%;
          background: var(--c);
          opacity: 0.85;
          transition: width 0.7s cubic-bezier(.4,0,.2,1);
        }
        .criteria-body {
          color: var(--text-muted);
          font-size: 13.5px;
          line-height: 1.6;
        }

        .comment-card {
          padding: 32px 36px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 28px;
          align-items: start;
        }
        .comment-mark {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 84px;
          line-height: 0.7;
          color: var(--accent-text);
          opacity: 0.55;
        }
        .comment-body { display: flex; flex-direction: column; gap: 14px; }
        .comment-body .label { color: var(--accent-text); }
        .comment-body p {
          margin: 0;
          font-size: 17px;
          line-height: 1.55;
          font-family: var(--font-display);
          font-weight: 400;
          letter-spacing: -0.005em;
          color: var(--text);
        }

        .breakdown-card { padding: 32px 36px; }
        .breakdown-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .breakdown-title {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.015em;
          margin: 4px 0 0;
          color: var(--text);
        }
        .breakdown-legend { display: flex; gap: 18px; flex-wrap: wrap; }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-label);
          font-weight: 500;
          font-size: 10.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .legend-swatch { width: 12px; height: 12px; border-radius: 3px; }
        .legend-swatch[data-kind="word"] {
          background: color-mix(in oklab, oklch(0.7 0.13 75) 22%, transparent);
          border: 1px solid color-mix(in oklab, oklch(0.7 0.13 75) 35%, transparent);
        }
        .legend-swatch[data-kind="phrase"] {
          background: color-mix(in oklab, oklch(0.65 0.15 25) 18%, transparent);
          border: 1px solid color-mix(in oklab, oklch(0.65 0.15 25) 35%, transparent);
        }
        .legend-swatch[data-kind="note"] { background: transparent; border: 1px dashed var(--text-dim); }

        .essay-body {
          font-size: 15.5px;
          line-height: 1.85;
          color: var(--text);
          font-family: var(--font-sans);
        }
        .essay-body p { margin: 0 0 18px; }
        .essay-body p:last-child { margin: 0; }

        /* Restyle inline error spans coming back from API.
           The API wraps errors in <span style="color:#ef4444;text-decoration:underline wavy #ef4444">word</span>
           and explanation in <span style="color:#6b7280;font-size:0.85em"> [...] </span>.
           We override those inline styles using :where() + attribute selectors. */
        .essay-body span[style*="ef4444"] {
          color: oklch(0.4 0.15 25) !important;
          text-decoration: none !important;
          background: color-mix(in oklab, oklch(0.65 0.15 25) 18%, transparent);
          border-bottom: 1px dashed oklch(0.65 0.15 25 / 0.7);
          border-radius: 4px;
          padding: 1px 4px;
          margin: 0 1px;
          cursor: help;
          font-weight: 500;
        }
        .essay-body span[style*="6b7280"] {
          color: var(--text-dim) !important;
          font-style: italic;
          margin: 0 4px;
          border: 1px dashed var(--border-strong);
          padding: 1px 8px;
          border-radius: 4px;
          font-size: 12.5px !important;
          font-family: var(--font-sans);
          display: inline;
          line-height: 1.4;
        }

        mark.word-rep {
          background: color-mix(in oklab, oklch(0.7 0.13 75) 22%, transparent);
          border-bottom: 1px dashed oklch(0.7 0.13 75 / 0.7);
          border-radius: 4px;
          color: oklch(0.42 0.13 75);
          cursor: help;
          padding: 1px 4px;
          margin: 0 1px;
          position: relative;
        }
        mark.word-rep::before {
          content: '';
          position: absolute;
          bottom: calc(100% + 3px);
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: var(--accent);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
          z-index: 60;
        }
        mark.word-rep::after {
          content: attr(title);
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: var(--accent);
          color: #fafafa;
          padding: 5px 11px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 500;
          font-family: var(--font-sans);
          white-space: nowrap;
          z-index: 60;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s, transform 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        mark.word-rep:hover::before, mark.word-rep:hover::after { opacity: 1; }
        mark.word-rep:hover::after { transform: translateX(-50%) translateY(0); }

        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .btn-secondary {
          width: 100%;
          padding: 13px 22px;
          border-radius: 12px;
          background: var(--bg-elev);
          border: 1px solid var(--border-strong);
          color: var(--text);
          font-weight: 500;
          font-size: 14px;
          font-family: var(--font-sans);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: 0.18s;
          cursor: pointer;
          min-height: 46px;
        }
        .btn-secondary:hover:not(:disabled) {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }

        @media (max-width: 720px) {
          .score-card, .comment-card, .breakdown-card { padding: 22px; }
          .score-big { font-size: 88px; }
          .criteria-grid { grid-template-columns: 1fr; }
          .comment-card { grid-template-columns: 1fr; gap: 12px; }
          .comment-mark { font-size: 64px; }
          .score-card { gap: 20px; }
        }
      `}</style>

      <div className="results" aria-live="polite">
        <div className="sec-head">
          <h2>{s.evaluationTitle}</h2>
          <span className="meta">{s.updatedNow} · {taskMode === "task2" ? "Task 2" : "Task 1"}</span>
        </div>

        {/* Score card */}
        <div className="card score-card anim-item" style={{ animationDelay: "0ms" }}>
          <div className="score-meta">
            <span className="label">{s.overallTitle}</span>
            <p className="score-headline">{result.summary}</p>
            <div className="score-progress" role="progressbar" aria-valuenow={result.overall} aria-valuemin={0} aria-valuemax={9}>
              <span style={{ width: `${overallPct}%` }} />
            </div>
            <div className="score-scale">
              <span>0</span><span>3</span><span>5</span><span>7</span><span>9</span>
            </div>
          </div>
          <div className="score-big">
            {Number(result.overall).toFixed(1)}<small>/ 9.0</small>
          </div>
        </div>

        {/* Criteria grid */}
        <div className="criteria-grid">
          {CRITERIA.map((c, i) => (
            <div
              key={c.key}
              className="criteria anim-item"
              style={{
                ["--c" as any]: `var(${c.cssVar})`,
                animationDelay: `${(i + 1) * 100}ms`,
              }}
            >
              <div className="criteria-head">
                <div className="criteria-name">
                  <span className="criteria-icon">{CRIT_ICONS[c.key]}</span>
                  {c.label}
                </div>
                <div className="criteria-score">{Number(result[c.key]).toFixed(1)}</div>
              </div>
              <div className="criteria-bar">
                <span style={{ width: `${(Number(result[c.key]) / 9) * 100}%` }} />
              </div>
              <div className="criteria-body">{result[c.key + "_comment"]}</div>
            </div>
          ))}
        </div>

        {/* Examiner Summary */}
        <div className="card comment-card anim-item" style={{ animationDelay: "500ms" }}>
          <div className="comment-mark">“</div>
          <div className="comment-body">
            <span className="label">{s.summaryTitle}</span>
            <p>{result.summary}</p>
          </div>
        </div>

        {/* Error breakdown */}
        <div className="card breakdown-card anim-item" style={{ animationDelay: "580ms" }}>
          <div className="breakdown-head">
            <div>
              <span className="label">{s.lineLevelFeedback}</span>
              <h3 className="breakdown-title">{s.whereMarksWent}</h3>
            </div>
            <div className="breakdown-legend">
              <div className="legend-item"><span className="legend-swatch" data-kind="word" /> {s.repeatedWordsLegend}</div>
              <div className="legend-item"><span className="legend-swatch" data-kind="phrase" /> {s.grammarLegend}</div>
              <div className="legend-item"><span className="legend-swatch" data-kind="note" /> {s.legendNote}</div>
            </div>
          </div>
          <div className="essay-body" dangerouslySetInnerHTML={{ __html: processedAnnotated }} />
        </div>

        {/* Improve My Essay */}
        {!improvedEssay && (
          <div className="anim-item" style={{ animationDelay: "640ms" }}>
            <button className="btn-secondary" onClick={onImprove} disabled={loadingImprove} aria-busy={loadingImprove}>
              {loadingImprove ? (
                <>
                  <span style={{
                    width: 14, height: 14,
                    border: "2px solid var(--border-strong)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  {s.improvingBtn}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
                  </svg>
                  {s.improveBtn}
                </>
              )}
            </button>
          </div>
        )}

        {improvedEssay && (
          <div className="card anim-item" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{
              padding: "18px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="label" style={{ color: "var(--accent-text)" }}>{s.improvedTitle}</span>
              </div>
              <button
                onClick={handleCopy}
                aria-label={copied ? s.copied : s.copy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${copied ? "var(--accent)" : "var(--border)"}`,
                  background: copied ? "var(--accent-soft)" : "var(--bg-elev)",
                  color: copied ? "var(--accent-text)" : "var(--text-muted)",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-label)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {copied ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {s.copied}
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M8 4V2.5A1.5 1.5 0 0 0 6.5 1h-4A1.5 1.5 0 0 0 1 2.5v4A1.5 1.5 0 0 0 2.5 8H4" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                    {s.copy}
                  </>
                )}
              </button>
            </div>
            <div style={{
              padding: "24px 28px",
              fontFamily: "var(--font-display)",
              fontSize: 17,
              lineHeight: 1.7,
              color: "var(--text)",
              whiteSpace: "pre-wrap",
              letterSpacing: "-0.005em",
            }}>
              {improvedEssay}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
