import { useState, useCallback } from "react";

const CRITERIA = [
  { key: "ta", label: "Task Achievement", icon: "\u{1F3AF}" },
  { key: "cc", label: "Coherence & Cohesion", icon: "\u{1F517}" },
  { key: "lr", label: "Lexical Resource", icon: "\u{1F4DA}" },
  { key: "gra", label: "Grammatical Range", icon: "\u{270F}\u{FE0F}" },
];

const BAND_COLOR = (score: number) =>
  score >= 7 ? "#16a34a" : score >= 5.5 ? "#d97706" : "#dc2626";

const BAND_BG = (score: number) =>
  score >= 7 ? "#f0fdf4" : score >= 5.5 ? "#fffbeb" : "#fef2f2";

const BAND_BORDER = (score: number) =>
  score >= 7 ? "#bbf7d0" : score >= 5.5 ? "#fde68a" : "#fecaca";

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
      <span
        style={{
          fontWeight: 700,
          fontSize: 15,
          color,
          minWidth: 28,
          textAlign: "right",
        }}
      >
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

export default function App() {
  const [question, setQuestion] = useState("");
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!question.trim() || !essay.trim()) {
      setError("Заполни оба поля — вопрос и эссе.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    const systemPrompt = `You are an expert IELTS examiner. The user will give you an IELTS Writing Task 2 question and an essay. You must evaluate the essay strictly according to the official IELTS Writing Task 2 band descriptors.

Return ONLY valid JSON (no markdown, no backticks, no preamble) with this exact structure:
{
  "overall": <number band 0-9 in 0.5 steps>,
  "ta": <number>,
  "cc": <number>,
  "lr": <number>,
  "gra": <number>,
  "ta_comment": "<2-3 sentence feedback in Russian>",
  "cc_comment": "<2-3 sentence feedback in Russian>",
  "lr_comment": "<2-3 sentence feedback in Russian>",
  "gra_comment": "<2-3 sentence feedback in Russian>",
  "summary": "<3-4 sentence overall summary in Russian with key advice>",
  "annotated": "<the full essay text in HTML where each error is wrapped in <span style='color:#ef4444;text-decoration:underline wavy #ef4444'> with a <span style='color:#6b7280;font-size:0.85em'> [explanation in Russian] </span> right after the error span>"
}

Scoring rules (apply STRICTLY):
- Task Achievement: Does the essay FULLY address ALL parts of the task? Is the position clear throughout? Are ideas well-extended with specific examples/evidence? Penalize heavily for: partially addressing the question, unclear position, underdeveloped ideas, irrelevant content, going off-topic even slightly.
- Coherence & Cohesion: Is there a clear logical progression? Are paragraphs well-structured with clear topic sentences? Are cohesive devices used naturally (not mechanically)? Penalize heavily for: overuse of linking words ("Moreover, Furthermore, In addition" chains), lack of referencing/substitution, poor paragraphing, ideas that don't flow logically.
- Lexical Resource: Is vocabulary varied, precise, and natural? Penalize heavily for: repetition of words/phrases, unnatural collocations, memorized phrases that feel forced, spelling errors, wrong word forms, L1 interference.
- Grammatical Range & Accuracy: Is there a genuine mix of complex structures used accurately? Penalize heavily for: relying on simple sentences, attempted complex structures with errors, article/preposition mistakes, subject-verb agreement errors, tense inconsistencies, punctuation errors.

CRITICAL SCORING INSTRUCTIONS:
- You are a STRICT examiner. When in doubt between two bands, ALWAYS give the LOWER score.
- Band 7+ requires genuinely impressive writing. Do NOT give 7+ unless the essay would truly impress a native-speaking examiner.
- Band 9 is virtually impossible for a non-native learner. Band 8+ is extremely rare.
- Most student essays realistically score between 5.0 and 6.5. A score of 7.0 should be reserved for clearly strong essays.
- Every single grammar/vocabulary error MUST lower the score. Do not overlook small mistakes.
- Memorized phrases and templates should be penalized — they indicate Band 5-6 level.
- If word count is under 250, automatically cap Task Achievement at 5.0 maximum.
- Compare the essay to what a REAL IELTS examiner would give, not what an encouraging teacher would give. Real examiners are tough.
In the annotated text, mark ALL errors: grammar, vocabulary, spelling, punctuation, awkward phrasing, and cohesion issues. Keep the original text intact, just wrap problem areas. Preserve line breaks as <br/>.`;

    try {
      const res = await fetch("/api/Check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `IELTS Writing Task 2 Question:\n${question}\n\nStudent's Essay:\n${essay}`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "API error");
      const raw = data.content.map((b: any) => b.text || "").join("");
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      console.log("API response parsed:", parsed);
      setResult(parsed);
    } catch (e: any) {
      setError("Ошибка: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [question, essay]);

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const isReady = question.trim() && essay.trim();

  const inputStyle = (field: string) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1.5px solid ${focusedField === field ? "#6366f1" : "#e5e7eb"}`,
    fontSize: 14,
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    outline: "none",
    lineHeight: 1.6,
    background: "#fff",
    color: "#111827",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
  });

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f8faff 0%, #f1f5ff 100%)",
        padding: "40px 16px 60px",
      }}
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        .result-enter { animation: fadeUp 0.4s ease forwards; }
        .btn-primary:hover:not(:disabled) { background: #4f46e5 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.35) !important; }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary { transition: all 0.2s ease !important; }
        .criterion-card:hover { border-color: #c7d2fe !important; box-shadow: 0 2px 12px rgba(99,102,241,0.08) !important; }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "#fff",
              border: "1px solid #e0e7ff",
              borderRadius: 999,
              padding: "6px 16px",
              marginBottom: 16,
              boxShadow: "0 1px 4px rgba(99,102,241,0.1)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6366f1", letterSpacing: 0.5 }}>
              AI-POWERED
            </span>
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              margin: "0 0 8px",
              color: "#0f172a",
              letterSpacing: -0.5,
            }}
          >
            IELTS Essay Checker
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
            Проверка по официальным критериям IELTS Writing Task 2
          </p>
        </div>

        {/* Input Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            padding: "28px 28px 24px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  display: "block",
                  marginBottom: 8,
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                Вопрос задания
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onFocus={() => setFocusedField("question")}
                onBlur={() => setFocusedField(null)}
                placeholder="Вставьте сюда вопрос IELTS Writing Task 2..."
                rows={3}
                style={inputStyle("question")}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Эссе
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: wordCount >= 250 ? "#f0fdf4" : wordCount > 0 ? "#fef2f2" : "#f9fafb",
                    border: `1px solid ${wordCount >= 250 ? "#bbf7d0" : wordCount > 0 ? "#fecaca" : "#e5e7eb"}`,
                    borderRadius: 999,
                    padding: "3px 10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: wordCount >= 250 ? "#16a34a" : wordCount > 0 ? "#dc2626" : "#9ca3af",
                    }}
                  >
                    {wordCount} слов
                  </span>
                  {wordCount > 0 && wordCount < 250 && (
                    <span style={{ fontSize: 12, color: "#dc2626" }}>
                      · мин. 250
                    </span>
                  )}
                </div>
              </div>
              <textarea
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                onFocus={() => setFocusedField("essay")}
                onBlur={() => setFocusedField(null)}
                placeholder="Вставьте своё эссе сюда..."
                rows={12}
                style={inputStyle("essay")}
              />
            </div>

            <button
              className="btn-primary"
              onClick={check}
              disabled={loading || !isReady}
              style={{
                padding: "14px 0",
                borderRadius: 10,
                border: "none",
                background: loading || !isReady ? "#e5e7eb" : "#6366f1",
                color: loading || !isReady ? "#9ca3af" : "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading || !isReady ? "not-allowed" : "pointer",
                letterSpacing: 0.2,
                boxShadow: isReady && !loading ? "0 2px 8px rgba(99,102,241,0.25)" : "none",
              }}
            >
              {loading ? "Анализирую эссе..." : "Проверить эссе"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 10,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>!</span>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
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
              Анализирую эссе по 4 критериям IELTS...
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
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
                  Overall Band Score
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", maxWidth: 340, lineHeight: 1.5 }}>
                  Итоговый балл по 4 критериям IELTS Writing Task 2
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
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4, fontWeight: 600 }}>
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
                      marginTop: 12,
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
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
                  Общий комментарий
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
                  Разбор ошибок
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
        )}
      </div>
    </div>
  );
}
