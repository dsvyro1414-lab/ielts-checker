import type { TaskMode } from "../types";
import type { Strings } from "../hooks/useLanguage";

const CRITERIA = [
  { key: "ta",  label: "Task Achievement",              clayClass: "clay-coral",  shadow: "#C94B3B" },
  { key: "cc",  label: "Coherence & Cohesion",          clayClass: "clay-purple", shadow: "#4A3FC0" },
  { key: "lr",  label: "Lexical Resource",              clayClass: "clay-mint",   shadow: "#1E9070" },
  { key: "gra", label: "Grammatical Range & Accuracy",  clayClass: "clay-yellow", shadow: "#C08010" },
];

const ICONS: Record<string, string> = {
  ta: "🎯",
  cc: "🔗",
  lr: "📚",
  gra: "✏️",
};

function BandBar({ score }: { score: number }) {
  const pct = (score / 9) * 100;
  return (
    <div className="band-bar-track" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={9} aria-label={`Score: ${score} out of 9`}>
      <div className="band-bar-fill" style={{ width: `${pct}%` }} />
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
        className="clay-white"
        style={{ textAlign: "center", padding: "56px 24px" }}
        aria-live="polite"
        aria-busy="true"
      >
        <div
          style={{
            width: 52,
            height: 52,
            border: "4px solid rgba(123,111,255,0.2)",
            borderTopColor: "#7B6FFF",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 0.8s linear infinite",
          }}
          aria-hidden="true"
        />
        <p style={{ fontSize: 15, color: "#888", margin: 0, fontWeight: 600, fontFamily: "'Nunito', system-ui, sans-serif" }}>
          {s.loadingText}
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="result-enter" style={{ display: "flex", flexDirection: "column", gap: 16 }} aria-live="polite">
      {/* Overall Band Score */}
      <div
        className="clay-dark"
        style={{ padding: "32px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            {s.overallTitle}
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", maxWidth: 340, lineHeight: 1.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {taskMode === "task1" ? s.overallSubtitleT1 : s.overallSubtitleT2}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "2px solid rgba(255,255,255,0.2)",
            borderRadius: 20,
            padding: "14px 28px",
            textAlign: "center",
            flexShrink: 0,
            backdropFilter: "blur(8px)",
            boxShadow: "inset 0 2px 6px rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              fontFamily: "'Nunito', system-ui, sans-serif",
              fontSize: 60,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1,
              background: "linear-gradient(135deg, #FFB52E, #FF6B5B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {result.overall}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, fontWeight: 600 }}>/ 9.0</div>
        </div>
      </div>

      {/* Criteria Grid */}
      <div className="criteria-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {CRITERIA.map((c) => (
          <div key={c.key} className={`criterion-card ${c.clayClass}`}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }} aria-hidden="true">{ICONS[c.key]}</span>
                <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Nunito', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.9 }}>
                  {c.label}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Nunito', system-ui, sans-serif",
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1,
                  textShadow: `2px 2px 0 ${c.shadow}`,
                }}
              >
                {result[c.key]}
              </span>
            </div>
            <BandBar score={result[c.key]} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.88)", lineHeight: 1.6, margin: "10px 0 0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {result[c.key + "_comment"]}
            </p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="clay-white" style={{ padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(145deg, #EDE9FF, #DDD8FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              boxShadow: "2px 2px 0 rgba(123,111,255,0.3)",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            💡
          </div>
          <span style={{ fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: 800, fontSize: 15, color: "#2A2545" }}>
            {s.summaryTitle}
          </span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: "#444", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {result.summary}
        </p>
      </div>

      {/* Annotated Essay */}
      <div className="clay-white" style={{ overflow: "hidden", padding: 0 }}>
        <div
          style={{
            padding: "16px 22px",
            background: "linear-gradient(145deg, #FFF1F0, #FFE8E5)",
            borderBottom: "1.5px solid rgba(255,107,91,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(145deg, #FF8A7D, #FF6B5B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              color: "#fff",
              fontWeight: 700,
              boxShadow: "2px 2px 0 #C94B3B",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            ✗
          </div>
          <span style={{ fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: 800, fontSize: 15, color: "#2D2D2D" }}>
            {s.errorsTitle}
          </span>
        </div>
        <div
          style={{
            padding: "22px 26px",
            background: "#fff",
            fontSize: 14,
            lineHeight: 1.9,
            color: "#374151",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
          dangerouslySetInnerHTML={{ __html: result.annotated }}
        />
      </div>
    </div>
  );
}
