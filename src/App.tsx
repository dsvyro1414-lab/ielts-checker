import { useState, useCallback } from "react";
import type { TaskMode } from "./types";
import { useLanguage, STRINGS } from "./hooks/useLanguage";
import { TaskForm } from "./components/TaskForm";
import { ResultsPanel } from "./components/ResultsPanel";
import { SettingsModal } from "./components/SettingsModal";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
  });

export default function App() {
  const { lang, setLang, s } = useLanguage();
  const [taskMode, setTaskMode] = useState<TaskMode>("task2");
  const [question, setQuestion] = useState("");
  const [essay, setEssay] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTaskChange = (mode: TaskMode) => {
    if (mode === taskMode) return;
    setTaskMode(mode);
    setResult(null);
    setError(null);
  };

  const handleImageChange = (file: File, preview: string) => {
    setImage(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(preview);
  };

  const isReady =
    taskMode === "task2"
      ? Boolean(question.trim() && essay.trim())
      : Boolean(image && essay.trim());

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
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: `Student's Essay (IELTS Writing Task 1):\n${essay}` },
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

  return (
    <div style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif", minHeight: "100vh", background: "#FAF8F4" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }

        /* ── Design tokens ── */
        :root {
          --sage: #7C9A7E;
          --sage-dark: #5A7A5C;
          --sage-light: #EEF4EE;
          --sage-mid: #C8DAC9;
          --bg: #FAF8F4;
          --surface: #FFFFFF;
          --border: #E8E4DE;
          --border-focus: #7C9A7E;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6560;
          --text-muted: #9B9590;
          --error: #C0392B;
          --error-bg: #FDF3F2;
          --error-border: #EDCDC9;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
          --radius-lg: 16px;
          --radius-md: 12px;
          --radius-sm: 8px;
        }

        /* ── Card ── */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        /* ── Navbar ── */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(250,248,244,0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          height: 60px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          justify-content: space-between;
        }
        .navbar-logo {
          font-family: 'Nunito', system-ui, sans-serif;
          font-weight: 800;
          font-size: 17px;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.3px;
        }
        .logo-mark {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--sage);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ── Hero ── */
        .hero {
          text-align: center;
          padding: 56px 24px 40px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--sage-light);
          border: 1px solid var(--sage-mid);
          border-radius: 999px;
          padding: 5px 14px;
          margin-bottom: 20px;
          font-size: 11px;
          font-weight: 700;
          color: var(--sage-dark);
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .hero h1 {
          font-family: 'Nunito', system-ui, sans-serif;
          font-weight: 900;
          font-size: clamp(30px, 5vw, 48px);
          line-height: 1.15;
          margin: 0 0 14px;
          color: var(--text-primary);
          letter-spacing: -1px;
        }
        .hero h1 em {
          font-style: normal;
          color: var(--sage);
        }
        .hero p {
          font-size: 16px;
          color: var(--text-secondary);
          max-width: 420px;
          margin: 0 auto;
          line-height: 1.65;
        }

        /* ── Form inputs ── */
        .field-label {
          display: block;
          font-family: 'Nunito', system-ui, sans-serif;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          color: var(--text-muted);
          margin-bottom: 7px;
        }
        .field-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: #FDFCFA;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary);
          outline: none;
          resize: vertical;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .field-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(124,154,126,0.15);
          background: #fff;
        }
        .field-input::placeholder { color: var(--text-muted); }

        /* ── Task toggle ── */
        .task-toggle {
          display: inline-flex;
          background: #F2EFEA;
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 24px;
          border: 1px solid var(--border);
        }
        .task-tab {
          font-family: 'Nunito', system-ui, sans-serif;
          font-weight: 700;
          font-size: 13px;
          padding: 7px 20px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
          min-height: 36px;
        }
        .task-tab.active {
          background: var(--surface);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }
        .task-tab:hover:not(.active) { color: var(--text-secondary); }

        /* ── Primary button ── */
        .btn-primary {
          font-family: 'Nunito', system-ui, sans-serif;
          font-weight: 800;
          font-size: 15px;
          width: 100%;
          padding: 13px;
          border-radius: var(--radius-sm);
          border: none;
          background: var(--sage);
          color: #fff;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
          letter-spacing: 0.1px;
          box-shadow: 0 1px 3px rgba(92,122,92,0.3);
          min-height: 48px;
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--sage-dark);
          box-shadow: 0 4px 12px rgba(92,122,92,0.35);
          transform: scale(1.02);
        }
        .btn-primary:active:not(:disabled) { transform: scale(0.99); }
        .btn-primary:disabled {
          background: #D4CFC8;
          color: #A09A94;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn-primary:focus-visible {
          outline: 3px solid rgba(124,154,126,0.5);
          outline-offset: 2px;
        }

        /* ── Upload zone ── */
        .upload-zone {
          border: 1.5px dashed var(--border);
          border-radius: var(--radius-md);
          background: #FDFCFA;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 36px 20px;
          color: var(--text-muted);
          min-height: 44px;
        }
        .upload-zone:hover {
          border-color: var(--sage);
          background: var(--sage-light);
          color: var(--sage-dark);
        }

        /* ── Criterion cards ── */
        .criterion-card {
          border-radius: var(--radius-md);
          padding: 20px;
          border: none;
          color: #fff;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          will-change: transform;
        }
        .criterion-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        /* ── Band bar (white on colored cards) ── */
        .band-bar-track {
          height: 5px;
          border-radius: 999px;
          background: rgba(255,255,255,0.3);
          overflow: hidden;
          margin: 10px 0 2px;
        }
        .band-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: rgba(255,255,255,0.92);
          transition: width 0.7s cubic-bezier(.4,0,.2,1);
        }

        /* ── Gear button ── */
        .gear-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          color: var(--text-muted);
          box-shadow: var(--shadow-sm);
          min-width: 36px;
        }
        .gear-btn:hover { color: var(--sage); border-color: var(--sage-mid); }
        .gear-btn:focus-visible { outline: 3px solid rgba(124,154,126,0.4); outline-offset: 2px; }

        /* ── Divider ── */
        .divider {
          height: 1px;
          background: var(--border);
          margin: 16px 0;
        }

        /* ── Animations ── */
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .anim-item {
          opacity: 0;
          animation: fadeSlideUp 0.36s ease-out both;
        }

        /* ── CSS noise texture on background ── */
        body::after {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 300px 300px;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-item { animation: none !important; opacity: 1 !important; }
          .btn-primary, .criterion-card { transition: none !important; }
        }
        @media (max-width: 600px) {
          .hero { padding: 36px 16px 28px; }
          .hero h1 { font-size: 26px; }
          .criteria-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-logo">
          <div className="logo-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10M3 8h7M3 12h5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          IELTS Checker
        </div>
        <SettingsModal lang={lang} setLang={setLang} s={s} />
      </nav>

      {/* Main content */}
      <main style={{ position: "relative", maxWidth: 760, margin: "0 auto", padding: "0 16px 80px" }}>
        {/* Hero */}
        <section className="hero" aria-label="Hero">
          <div className="hero-badge">
            <svg width="7" height="7" viewBox="0 0 7 7" aria-hidden="true">
              <circle cx="3.5" cy="3.5" r="3.5" fill="#7C9A7E"/>
            </svg>
            {s.badge}
          </div>
          <h1>
            <em>IELTS</em> Essay Checker
          </h1>
          <p>{s.subtitle}</p>
        </section>

        <TaskForm
          taskMode={taskMode}
          onTaskChange={handleTaskChange}
          question={question}
          setQuestion={setQuestion}
          essay={essay}
          setEssay={setEssay}
          image={image}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          loading={loading}
          isReady={isReady}
          onSubmit={check}
          s={s}
        />

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: "13px 16px",
              borderRadius: 10,
              background: "var(--error-bg)",
              border: "1px solid var(--error-border)",
              color: "var(--error)",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="#C0392B" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <ResultsPanel result={result} taskMode={taskMode} loading={loading} s={s} />
      </main>
    </div>
  );
}
