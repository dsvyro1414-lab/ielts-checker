import { useState, useCallback, useRef, useEffect } from "react";

type Lang = "en" | "ru";
type TaskMode = "task1" | "task2";

const STRINGS = {
  en: {
    badge: "AI-POWERED",
    title: "IELTS Essay Checker",
    subtitle: "AI evaluation using official IELTS Writing criteria",
    t1: "Task 1",
    t2: "Task 2",
    questionLabel: "TASK QUESTION",
    questionPlaceholder: "Paste the IELTS Writing Task 2 question here...",
    imageLabel: "CHART / DIAGRAM",
    imagePlaceholder: "Click to upload image (JPG or PNG)",
    imageChange: "Change image",
    essayLabel: "ESSAY",
    essayPlaceholder: "Paste your essay here...",
    words: (n: number) => `${n} words`,
    minWords: (min: number) => `· min. ${min}`,
    checkBtn: "Check Essay",
    checkingBtn: "Analysing essay...",
    errorTask2: "Please fill in both fields — question and essay.",
    errorTask1: "Please upload an image and write your essay.",
    errorGeneric: "Error: ",
    loadingText: "Analysing essay against 4 IELTS criteria...",
    overallTitle: "Overall Band Score",
    overallSubtitleT1: "Score across 4 IELTS Writing Task 1 criteria",
    overallSubtitleT2: "Score across 4 IELTS Writing Task 2 criteria",
    summaryTitle: "Overall Comment",
    errorsTitle: "Error Breakdown",
    settingsTitle: "Settings",
    languageLabel: "Language",
    langEn: "English",
    langRu: "Russian",
  },
  ru: {
    badge: "НА ОСНОВЕ ИИ",
    title: "IELTS Essay Checker",
    subtitle: "Проверка по официальным критериям IELTS Writing",
    t1: "Task 1",
    t2: "Task 2",
    questionLabel: "ВОПРОС ЗАДАНИЯ",
    questionPlaceholder: "Вставьте сюда вопрос IELTS Writing Task 2...",
    imageLabel: "ГРАФИК / ДИАГРАММА",
    imagePlaceholder: "Нажмите для загрузки (JPG или PNG)",
    imageChange: "Изменить изображение",
    essayLabel: "ЭССЕ",
    essayPlaceholder: "Вставьте своё эссе сюда...",
    words: (n: number) => `${n} слов`,
    minWords: (min: number) => `· мин. ${min}`,
    checkBtn: "Проверить эссе",
    checkingBtn: "Анализирую эссе...",
    errorTask2: "Заполни оба поля — вопрос и эссе.",
    errorTask1: "Загрузи изображение и напиши эссе.",
    errorGeneric: "Ошибка: ",
    loadingText: "Анализирую эссе по 4 критериям IELTS...",
    overallTitle: "Overall Band Score",
    overallSubtitleT1: "Балл по 4 критериям IELTS Writing Task 1",
    overallSubtitleT2: "Итоговый балл по 4 критериям IELTS Writing Task 2",
    summaryTitle: "Общий комментарий",
    errorsTitle: "Разбор ошибок",
    settingsTitle: "Настройки",
    languageLabel: "Язык",
    langEn: "Английский",
    langRu: "Русский",
  },
} as const;

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

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
  });

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

function GearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export default function App() {
  const [taskMode, setTaskMode] = useState<TaskMode>("task2");
  const [lang, setLang] = useState<Lang>("en");
  const [showSettings, setShowSettings] = useState(false);
  const [question, setQuestion] = useState("");
  const [essay, setEssay] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const s = STRINGS[lang];
  const settingsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const minWords = taskMode === "task1" ? 150 : 250;

  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    // reset file input so same file can be re-selected
    e.target.value = "";
  };

  const handleTaskSwitch = (mode: TaskMode) => {
    if (mode === taskMode) return;
    setTaskMode(mode);
    setResult(null);
    setError(null);
  };

  const check = useCallback(async () => {
    if (taskMode === "task2" && (!question.trim() || !essay.trim())) {
      setError(STRINGS[lang].errorTask2);
      return;
    }
    if (taskMode === "task1" && (!image || !essay.trim())) {
      setError(STRINGS[lang].errorTask1);
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    const feedbackLang = lang === "ru" ? "Russian" : "English";

    const jsonStructure = `{
  "overall": <number band 0-9 in 0.5 steps>,
  "ta": <number>,
  "cc": <number>,
  "lr": <number>,
  "gra": <number>,
  "ta_comment": "<2-3 sentence feedback in ${feedbackLang}>",
  "cc_comment": "<2-3 sentence feedback in ${feedbackLang}>",
  "lr_comment": "<2-3 sentence feedback in ${feedbackLang}>",
  "gra_comment": "<2-3 sentence feedback in ${feedbackLang}>",
  "summary": "<3-4 sentence overall summary in ${feedbackLang} with key advice>",
  "annotated": "<the full essay text in HTML where each error is wrapped in <span style='color:#ef4444;text-decoration:underline wavy #ef4444'> with a <span style='color:#6b7280;font-size:0.85em'> [explanation in ${feedbackLang}] </span> right after the error span>"
}`;

    const systemPrompt =
      taskMode === "task2"
        ? `You are an expert IELTS examiner. The user will give you an IELTS Writing Task 2 question and an essay. You must evaluate the essay strictly according to the official IELTS Writing Task 2 band descriptors.

Return ONLY valid JSON (no markdown, no backticks, no preamble) with this exact structure:
${jsonStructure}

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
In the annotated text, mark ALL errors: grammar, vocabulary, spelling, punctuation, awkward phrasing, and cohesion issues. Keep the original text intact, just wrap problem areas. Preserve line breaks as <br/>.`
        : `You are an expert IELTS examiner. The user will provide an image of a chart, graph, table, map, or diagram along with a student's essay describing it. Evaluate the essay strictly according to the official IELTS Writing Task 1 band descriptors.

Return ONLY valid JSON (no markdown, no backticks, no preamble) with this exact structure:
${jsonStructure}

Scoring rules (apply STRICTLY):
- Task Achievement: Does the essay accurately identify and describe the key features and trends? Is there a clear overview? Are specific data points cited as support? Penalize heavily for: missing key trends, inaccurate data references, no overview paragraph, describing every minor detail without selecting the most significant, not comparing/contrasting where appropriate.
- Coherence & Cohesion: Is the information organised logically? Are comparisons and contrasts clearly signalled? Penalize heavily for: random jumping between data points, overuse of mechanical linking words, weak paragraph structure.
- Lexical Resource: Is vocabulary varied and precise for describing data (e.g. "peaked at", "declined sharply", "accounted for", "remained stable")? Penalize heavily for: repetition, unnatural data language, vague terms, spelling errors.
- Grammatical Range & Accuracy: Is there a genuine mix of complex structures used accurately? Penalize heavily for: repeated same structures, tense errors (must use appropriate tense for the data's time frame), article/preposition mistakes.

CRITICAL SCORING INSTRUCTIONS:
- You are a STRICT examiner. When in doubt between two bands, ALWAYS give the LOWER score.
- Band 7+ requires accurate, well-selected data with natural, varied language.
- Most student essays realistically score between 5.0 and 6.5.
- If word count is under 150, automatically cap Task Achievement at 5.0 maximum.
- Personal opinion must NOT appear in Task 1 — penalize if found.
- Compare the essay to what a REAL IELTS examiner would give.
In the annotated text, mark ALL errors: grammar, vocabulary, spelling, punctuation, awkward phrasing, inaccurate data references. Keep the original text intact, just wrap problem areas. Preserve line breaks as <br/>.`;

    try {
      let messageContent: any;

      if (taskMode === "task2") {
        messageContent = `IELTS Writing Task 2 Question:\n${question}\n\nStudent's Essay:\n${essay}`;
      } else {
        const base64 = await fileToBase64(image!);
        const mediaType = image!.type as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp";
        messageContent = [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `Student's Essay (IELTS Writing Task 1):\n${essay}`,
          },
        ];
      }

      const res = await fetch("/api/Check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: "user", content: messageContent }],
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
      setError(STRINGS[lang].errorGeneric + e.message);
    } finally {
      setLoading(false);
    }
  }, [taskMode, question, essay, image, lang]);

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const isReady =
    taskMode === "task2"
      ? Boolean(question.trim() && essay.trim())
      : Boolean(image && essay.trim());

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
    boxShadow:
      focusedField === field ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
  });

  const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: 13,
    display: "block",
    marginBottom: 8,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  };

  const essayTextarea = (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <label style={labelStyle}>{s.essayLabel}</label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background:
              wordCount >= minWords
                ? "#f0fdf4"
                : wordCount > 0
                ? "#fef2f2"
                : "#f9fafb",
            border: `1px solid ${
              wordCount >= minWords
                ? "#bbf7d0"
                : wordCount > 0
                ? "#fecaca"
                : "#e5e7eb"
            }`,
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color:
                wordCount >= minWords
                  ? "#16a34a"
                  : wordCount > 0
                  ? "#dc2626"
                  : "#9ca3af",
            }}
          >
            {s.words(wordCount)}
          </span>
          {wordCount > 0 && wordCount < minWords && (
            <span style={{ fontSize: 12, color: "#dc2626" }}>
              {s.minWords(minWords)}
            </span>
          )}
        </div>
      </div>
      <textarea
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        onFocus={() => setFocusedField("essay")}
        onBlur={() => setFocusedField(null)}
        placeholder={s.essayPlaceholder}
        rows={12}
        style={inputStyle("essay")}
      />
    </div>
  );

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
        .upload-zone:hover { border-color: #6366f1 !important; background: #f5f3ff !important; }
        .gear-btn:hover { background: #f3f4f6 !important; color: #6366f1 !important; }
        .task-tab:hover { color: #6366f1 !important; }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36, position: "relative" }}>
          {/* Settings gear — top right */}
          <div
            ref={settingsRef}
            style={{ position: "absolute", top: 0, right: 0 }}
          >
            <button
              className="gear-btn"
              onClick={() => setShowSettings((v) => !v)}
              aria-label="Settings"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: showSettings ? "#f3f4f6" : "#fff",
                color: showSettings ? "#6366f1" : "#6b7280",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <GearIcon />
            </button>

            {showSettings && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "16px 18px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                  minWidth: 200,
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: "#111827",
                    marginBottom: 14,
                    paddingBottom: 10,
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  {s.settingsTitle}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 8,
                    }}
                  >
                    {s.languageLabel}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      background: "#f3f4f6",
                      borderRadius: 8,
                      padding: 3,
                    }}
                  >
                    {(["en", "ru"] as Lang[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: lang === l ? "#6366f1" : "transparent",
                          color: lang === l ? "#fff" : "#6b7280",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {l === "en" ? s.langEn : s.langRu}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Badge */}
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
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#6366f1",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#6366f1",
                letterSpacing: 0.5,
              }}
            >
              {s.badge}
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
            {s.title}
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
            {s.subtitle}
          </p>
        </div>

        {/* Input Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            padding: "24px 28px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
            marginBottom: 16,
          }}
        >
          {/* Task Toggle */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 24,
              background: "#f3f4f6",
              padding: 4,
              borderRadius: 10,
            }}
          >
            {(["task2", "task1"] as TaskMode[]).map((mode) => (
              <button
                key={mode}
                className="task-tab"
                onClick={() => handleTaskSwitch(mode)}
                style={{
                  flex: 1,
                  padding: "9px 16px",
                  borderRadius: 7,
                  border: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  background: taskMode === mode ? "#fff" : "transparent",
                  color: taskMode === mode ? "#6366f1" : "#6b7280",
                  boxShadow:
                    taskMode === mode
                      ? "0 1px 4px rgba(0,0,0,0.1)"
                      : "none",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
              >
                {mode === "task1" ? s.t1 : s.t2}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {taskMode === "task2" ? (
              <>
                {/* Task 2: Question */}
                <div>
                  <label style={labelStyle}>{s.questionLabel}</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onFocus={() => setFocusedField("question")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={s.questionPlaceholder}
                    rows={3}
                    style={inputStyle("question")}
                  />
                </div>

                {/* Task 2: Essay */}
                {essayTextarea}
              </>
            ) : (
              <>
                {/* Task 1: Image upload */}
                <div>
                  <label style={labelStyle}>{s.imageLabel}</label>

                  {imagePreview ? (
                    <div
                      style={{
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#f9fafb",
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Uploaded chart"
                        style={{
                          width: "100%",
                          maxHeight: 280,
                          objectFit: "contain",
                          display: "block",
                          background: "#fff",
                        }}
                      />
                      <div
                        style={{
                          padding: "10px 14px",
                          borderTop: "1px solid #e5e7eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            color: "#6b7280",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "70%",
                          }}
                        >
                          {image?.name}
                        </span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#6366f1",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontFamily: "inherit",
                          }}
                        >
                          {s.imageChange}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="upload-zone"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        padding: "32px 20px",
                        border: "1.5px dashed #d1d5db",
                        borderRadius: 10,
                        background: "#fafafa",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        color: "#9ca3af",
                      }}
                    >
                      <UploadIcon />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {s.imagePlaceholder}
                      </span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </div>

                {/* Task 1: Essay */}
                {essayTextarea}
              </>
            )}

            {/* Submit button */}
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
                boxShadow:
                  isReady && !loading
                    ? "0 2px 8px rgba(99,102,241,0.25)"
                    : "none",
                fontFamily: "inherit",
              }}
            >
              {loading ? s.checkingBtn : s.checkBtn}
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
              {s.loadingText}
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div
            className="result-enter"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
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
                <div
                  style={{ fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1 }}
                >
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
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
            >
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
                  {s.summaryTitle}
                </span>
              </div>
              <p
                style={{ fontSize: 14, lineHeight: 1.7, color: "#374151", margin: 0 }}
              >
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
        )}
      </div>
    </div>
  );
}
