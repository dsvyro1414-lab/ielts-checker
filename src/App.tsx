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
    <div style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif", minHeight: "100vh", background: "#FFFAF4" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }

        /* Clay design tokens */
        :root {
          --coral: #FF6B5B;
          --coral-light: #FF8A7D;
          --coral-dark: #E05040;
          --purple: #7B6FFF;
          --purple-light: #9D94FF;
          --purple-dark: #5A50E0;
          --mint: #3EC99A;
          --mint-light: #65D9B0;
          --mint-dark: #2BA87E;
          --yellow: #FFB52E;
          --yellow-light: #FFC85A;
          --yellow-dark: #E09A18;
          --bg: #FFFAF4;
          --text: #2D2D2D;
          --text-muted: #6B6B6B;
          --surface: #FFFFFF;
          --border: rgba(0,0,0,0.08);
          --radius-lg: 24px;
          --radius-md: 16px;
          --radius-sm: 12px;
        }

        /* Clay card mixin */
        .clay-white {
          background: linear-gradient(145deg, #ffffff, #f5f0ff10);
          border-radius: var(--radius-lg);
          box-shadow: 6px 6px 0 rgba(0,0,0,0.10), inset 0 2px 6px rgba(255,255,255,0.8);
          border: 1.5px solid rgba(0,0,0,0.07);
        }
        .clay-coral {
          background: linear-gradient(145deg, #FF8A7D, #FF6B5B);
          border-radius: var(--radius-md);
          box-shadow: 5px 5px 0 #C94B3B, inset 0 2px 6px rgba(255,255,255,0.3);
        }
        .clay-purple {
          background: linear-gradient(145deg, #9D94FF, #7B6FFF);
          border-radius: var(--radius-md);
          box-shadow: 5px 5px 0 #4A3FC0, inset 0 2px 6px rgba(255,255,255,0.3);
        }
        .clay-mint {
          background: linear-gradient(145deg, #65D9B0, #3EC99A);
          border-radius: var(--radius-md);
          box-shadow: 5px 5px 0 #1E9070, inset 0 2px 6px rgba(255,255,255,0.3);
        }
        .clay-yellow {
          background: linear-gradient(145deg, #FFC85A, #FFB52E);
          border-radius: var(--radius-md);
          box-shadow: 5px 5px 0 #C08010, inset 0 2px 6px rgba(255,255,255,0.3);
        }
        .clay-dark {
          background: linear-gradient(145deg, #3A3560, #2A2545);
          border-radius: var(--radius-lg);
          box-shadow: 6px 6px 0 rgba(0,0,0,0.25), inset 0 2px 6px rgba(255,255,255,0.08);
        }

        /* Buttons */
        .btn-clay {
          font-family: 'Nunito', system-ui, sans-serif;
          font-weight: 800;
          font-size: 16px;
          border: none;
          cursor: pointer;
          padding: 14px 32px;
          border-radius: 14px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          letter-spacing: 0.2px;
        }
        .btn-clay:hover:not(:disabled) { transform: translateY(-2px); }
        .btn-clay:active:not(:disabled) { transform: translateY(1px); }
        .btn-primary-clay {
          background: linear-gradient(145deg, #9D94FF, #7B6FFF);
          color: #fff;
          box-shadow: 4px 4px 0 #4A3FC0, inset 0 2px 4px rgba(255,255,255,0.3);
        }
        .btn-primary-clay:hover:not(:disabled) {
          box-shadow: 6px 6px 0 #4A3FC0, inset 0 2px 4px rgba(255,255,255,0.3);
        }
        .btn-primary-clay:disabled {
          background: linear-gradient(145deg, #d1d5db, #c4c8cf);
          color: #9ca3af;
          box-shadow: 4px 4px 0 #a0a5ad;
          cursor: not-allowed;
        }

        /* Navbar */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,250,244,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1.5px solid rgba(0,0,0,0.07);
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-logo {
          font-family: 'Nunito', system-ui, sans-serif;
          font-weight: 900;
          font-size: 20px;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .navbar-logo-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7B6FFF, #FF6B5B);
          display: inline-block;
        }

        /* Hero */
        .hero {
          text-align: center;
          padding: 60px 24px 48px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #EDE9FF, #FFE4E0);
          border: 1.5px solid rgba(123,111,255,0.2);
          border-radius: 999px;
          padding: 6px 16px;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: 700;
          color: #5A50E0;
          letter-spacing: 0.5px;
        }
        .hero h1 {
          font-family: 'Nunito', system-ui, sans-serif;
          font-weight: 900;
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1.15;
          margin: 0 0 16px;
          color: var(--text);
          letter-spacing: -1px;
        }
        .hero h1 span {
          background: linear-gradient(135deg, #7B6FFF 0%, #FF6B5B 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero p {
          font-size: 17px;
          color: var(--text-muted);
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Form inputs */
        .clay-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid rgba(0,0,0,0.08);
          background: #FFFEF8;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 14px;
          color: var(--text);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          resize: vertical;
          line-height: 1.6;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.04);
        }
        .clay-input:focus {
          border-color: #7B6FFF;
          box-shadow: 0 0 0 4px rgba(123,111,255,0.12), inset 0 2px 4px rgba(0,0,0,0.04);
        }
        .clay-input::placeholder { color: #aaa; }

        /* Label */
        .field-label {
          display: block;
          font-family: 'Nunito', system-ui, sans-serif;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        /* Task toggle */
        .task-toggle {
          display: inline-flex;
          background: #F0ECF8;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
        }
        .task-tab {
          font-family: 'Nunito', system-ui, sans-serif;
          font-weight: 700;
          font-size: 14px;
          padding: 8px 20px;
          border-radius: 9px;
          border: none;
          background: transparent;
          color: #888;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .task-tab.active {
          background: linear-gradient(145deg, #9D94FF, #7B6FFF);
          color: #fff;
          box-shadow: 3px 3px 0 #4A3FC0, inset 0 1px 3px rgba(255,255,255,0.3);
        }
        .task-tab:hover:not(.active) { color: #5A50E0; }

        /* Upload zone */
        .upload-zone {
          border: 2px dashed rgba(123,111,255,0.3);
          border-radius: 16px;
          background: linear-gradient(145deg, #FEFCFF, #F7F4FF);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 36px 20px;
          color: #9ca3af;
        }
        .upload-zone:hover {
          border-color: #7B6FFF;
          background: linear-gradient(145deg, #F5F2FF, #EDE9FF);
          color: #7B6FFF;
        }

        /* Criterion cards */
        .criterion-card {
          border-radius: 18px;
          padding: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          color: #fff;
        }
        .criterion-card:hover {
          transform: translateY(-2px);
        }

        /* Band bar */
        .band-bar-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.3);
          overflow: hidden;
          margin: 10px 0 4px;
        }
        .band-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: rgba(255,255,255,0.9);
          transition: width 0.6s cubic-bezier(.4,0,.2,1);
        }

        /* Blob decorations */
        .blob-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
        }

        /* Gear button */
        .gear-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1.5px solid rgba(0,0,0,0.08);
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #6b7280;
          box-shadow: 2px 2px 0 rgba(0,0,0,0.06);
        }
        .gear-btn:hover { color: #7B6FFF; border-color: #7B6FFF; }

        /* Animations */
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .result-enter { animation: fadeUp 0.4s ease forwards; }

        @media (prefers-reduced-motion: reduce) {
          .btn-clay, .criterion-card, .result-enter { animation: none; transition: none; }
        }
        @media (max-width: 600px) {
          .hero { padding: 40px 16px 32px; }
          .hero h1 { font-size: 28px; }
          .criteria-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Background blobs */}
      <div className="blob-container" aria-hidden="true">
        <div className="blob" style={{ width: 500, height: 500, background: "#7B6FFF", top: -100, right: -100 }} />
        <div className="blob" style={{ width: 400, height: 400, background: "#FF6B5B", bottom: 100, left: -120 }} />
        <div className="blob" style={{ width: 300, height: 300, background: "#3EC99A", bottom: -80, right: 200 }} />
      </div>

      {/* Navbar */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-logo">
          <span className="navbar-logo-dot" />
          IELTS Checker
        </div>
        <SettingsModal lang={lang} setLang={setLang} s={s} />
      </nav>

      {/* Main content */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "0 16px 80px" }}>
        {/* Hero */}
        <section className="hero" aria-label="Hero">
          <div className="hero-badge">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7B6FFF", display: "inline-block" }} />
            {s.badge}
          </div>
          <h1>
            {s.title.includes("IELTS") ? (
              <>
                <span>IELTS</span> Essay Checker
              </>
            ) : s.title}
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
              padding: "14px 18px",
              borderRadius: 14,
              background: "linear-gradient(145deg, #FFF0EE, #FFE8E5)",
              border: "1.5px solid rgba(255,107,91,0.3)",
              color: "#C94B3B",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "3px 3px 0 rgba(255,107,91,0.15)",
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            {error}
          </div>
        )}

        <ResultsPanel result={result} taskMode={taskMode} loading={loading} s={s} />
      </main>
    </div>
  );
}
