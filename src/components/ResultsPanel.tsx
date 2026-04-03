import type { TaskMode } from "../types";
import type { Strings } from "../hooks/useLanguage";

const CRITERIA = [
  { key: "ta", label: "Task Achievement", icon: "\u{1F3AF}" },
  { key: "cc", label: "Coherence & Cohesion", icon: "\u{1F517}" },
  { key: "lr", label: "Lexical Resource", icon: "\u{1F4DA}" },
  { key: "gra", label: "Grammatical Range & Accuracy", icon: "\u{270F}\u{FE0F}" },
];

const BAND_COLOR = (score: number) =>
  score >= 7 ? "#16a34a" : score >= 5.5 ? "#d97706" : "#6f0f0f";

const BAND_BG = (score: number) =>
  score >= 7 ? "#f0fdf4" : score >= 5.5 ? "#fffbeb" : "#fef2f2";

const BAND_BORDER = (score: number) =>
  score >= 7 ? "#bbf7d0" : score >= 5.5 ? "#fde68a" : "#15e53f";

function BandBar({ score }: { score: number }) {
  const pct = (score / 9) * 100;
  const color = BAND_COLOR(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 999,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
            transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      <span style={{ fontWeight: 700, fontSize: 15, color, minWidth: 28, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = BAND_COLOR(score);
  const bg = BAND_BG(score);
  const border = BAND_BORDER(score);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: 12,
        background: bg,
        border: `1.5px solid ${border}`,
        color,
        fontWeight: 800,
        fontSize: 16,
        flexShrink: 0,
      }}
    >
      {score}
    </div>
  );
}

interface Props {
  result: any;
  taskMode: TaskMode;
  loading: boolean;
  s: Pick<
    Strings,
    | "loadingText"
    | "overallTitle"
    | "overallSubtitleT1"
    | "overallSubtitleT2"
    | "summaryTitle"
    | "errorsTitle"
  >;
}

export function ResultsPanel({ result, taskMode, loading, s }: Props) {
  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 0",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            border: "3px solid #e0e7ff",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0, fontWeight: 500 }}>
          {s.loadingText}
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="result-enter" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Overall Band Score */}
      <div
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, #312e81 0%, #6366f1 100%)",
          padding: "32px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 6,
            }}
          >
            {s.overallTitle}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.85)",
              maxWidth: 340,
              lineHeight: 1.5,
            }}
          >
            {taskMode === "task1" ? s.overallSubtitleT1 : s.overallSubtitleT2}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.25)",
            borderRadius: 20,
            padding: "12px 24px",
            backdropFilter: "blur(8px)",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
            {result.overall}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              marginTop: 4,
              fontWeight: 600,
            }}
          >
            / 9.0
          </div>
        </div>
      </div>

      {/* Criteria Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {CRITERIA.map((c) => (
          <div
            key={c.key}
            className="criterion-card"
            style={{
              padding: "18px 20px",
              borderRadius: 14,
              border: "1.5px solid #e5e7eb",
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                {c.icon} {c.label}
              </div>
              <ScoreBadge score={result[c.key]} />
            </div>
            <BandBar score={result[c.key]} />
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                lineHeight: 1.6,
                margin: "12px 0 0",
              }}
            >
              {result[c.key + "_comment"]}
            </p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div
        style={{
          padding: "20px 24px",
          borderRadius: 14,
          background: "#fafaff",
          border: "1.5px solid #e0e7ff",
          boxShadow: "0 1px 4px rgba(99,102,241,0.06)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#e0e7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "#6366f1",
              fontWeight: 700,
            }}
          >
            i
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#312e81" }}>
            {s.summaryTitle}
          </span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "#374151", margin: 0 }}>
          {result.summary}
        </p>
      </div>

      {/* Annotated Essay */}
      <div
        style={{
          borderRadius: 14,
          border: "1.5px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            ✗
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
            {s.errorsTitle}
          </span>
        </div>
        <div
          style={{
            padding: "20px 24px",
            background: "#fff",
            fontSize: 14,
            lineHeight: 1.9,
            color: "#374151",
          }}
          dangerouslySetInnerHTML={{ __html: result.annotated }}
        />
      </div>
    </div>
  );
}
