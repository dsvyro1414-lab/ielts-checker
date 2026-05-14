import { useState, useCallback, useEffect } from "react";
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

const LOADING_STAGES = [
  { stage: "Reading your essay", step: "Tokenising and counting" },
  { stage: "Evaluating task response", step: "Comparing against the band descriptors" },
  { stage: "Checking cohesion & lexis", step: "Mapping discourse markers and collocations" },
  { stage: "Auditing grammar", step: "Scanning for article, tense and preposition errors" },
  { stage: "Assembling your report", step: "Producing band scores and feedback" },
];

function LoadingOverlay({ progress, stageIdx }: { progress: number; stageIdx: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const off = c - (progress / 100) * c;
  const cur = LOADING_STAGES[Math.min(stageIdx, LOADING_STAGES.length - 1)];
  const words = cur.stage.split(" ");
  const head = words.slice(0, -1).join(" ");
  const tail = words.slice(-1).join(" ");

  return (
    <div className="loading">
      <div className="loading-inner">
        <div className="loading-orb">
          <svg viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={r} stroke="var(--border)" strokeWidth="2" fill="none" />
            <circle
              cx="44"
              cy="44"
              r={r}
              stroke="var(--accent)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={off}
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
          </svg>
          <div className="loading-orb-num">{Math.round(progress)}%</div>
        </div>
        <h3 className="loading-stage">
          {head} <em>{tail}</em>
        </h3>
        <div className="loading-step">{cur.step}</div>
        <div className="loading-steps">
          {LOADING_STAGES.map((_, i) => (
            <span key={i} data-active={i === stageIdx} data-done={i < stageIdx} />
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [improvedEssay, setImprovedEssay] = useState<string | null>(null);
  const [loadingImprove, setLoadingImprove] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  // Apply theme attributes for design tokens
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.setAttribute("data-accent", "mono");
  }, []);

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
    setImprovedEssay(null);
    setProgress(0);
    setStageIdx(0);

    // Animate the loading stages while the API request is in flight.
    // First pass races through stages over ~6s to ~85%, then asymptotically
    // crawls toward 99% so it never feels stuck.
    const fastPhaseMs = 6000;
    const startT = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - startT;
      let p: number;
      if (elapsed < fastPhaseMs) {
        p = (elapsed / fastPhaseMs) * 85;
        const idx = Math.min(
          LOADING_STAGES.length - 1,
          Math.floor((elapsed / fastPhaseMs) * LOADING_STAGES.length),
        );
        setStageIdx(idx);
      } else {
        // Asymptote: approach 99 but never hit it. ~14s after fast phase → ~95%.
        const tail = elapsed - fastPhaseMs;
        p = 85 + (99 - 85) * (1 - Math.exp(-tail / 7000));
        setStageIdx(LOADING_STAGES.length - 1);
      }
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

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
          model: "claude-sonnet-4-6",
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
      setResult(parsed);
      setProgress(100);
      setStageIdx(LOADING_STAGES.length - 1);
    } catch (e: any) {
      setError(STRINGS[lang].errorGeneric + e.message);
    } finally {
      cancelAnimationFrame(raf);
      // small fade after 100% so users see completion
      setTimeout(() => setLoading(false), 300);
    }
  }, [taskMode, question, essay, image, lang]);

  const improve = useCallback(async () => {
    if (!result) return;
    setLoadingImprove(true);

    const taskContext = taskMode === "task2"
      ? `IELTS Writing Task 2 Question:\n${question}`
      : `IELTS Writing Task 1 (chart/diagram description)`;

    const prompt = `You are an expert IELTS writing coach. Below is a student's essay with its evaluation scores and feedback.

${taskContext}

Student's Essay:
${essay}

Evaluation:
- Overall Band: ${result.overall}/9
- Task Achievement: ${result.ta}/9 — ${result.ta_comment}
- Coherence & Cohesion: ${result.cc}/9 — ${result.cc_comment}
- Lexical Resource: ${result.lr}/9 — ${result.lr_comment}
- Grammatical Range & Accuracy: ${result.gra}/9 — ${result.gra_comment}

Rewrite the essay to fix ALL the weaknesses identified above. Improve vocabulary range and precision, grammatical accuracy and complexity, coherence and paragraph structure, and task achievement. Preserve the student's original arguments, position, and voice — do not introduce new ideas. Aim for a Band 7+ essay.

Output ONLY the improved essay text. No title, no labels, no explanation, no preamble.`;

    try {
      const res = await fetch("/api/Check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "API error");
      const text = data.content.map((b: any) => b.text || "").join("").trim();
      setImprovedEssay(text);
    } catch (e: any) {
      setError(STRINGS[lang].errorGeneric + e.message);
    } finally {
      setLoadingImprove(false);
    }
  }, [result, taskMode, question, essay, lang]);

  // ⌘+Enter shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (isReady && !loading) check();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [check, isReady, loading]);

  const heroTitle = lang === "ru" ? (
    <>Честный балл <em>за минуту.</em></>
  ) : (
    <>An honest band, in <em>under a minute.</em></>
  );
  const heroSub = lang === "ru"
    ? "Эссе оценивается по официальным критериям IELTS Writing — с разбором ошибок и понятным путём к следующему баллу."
    : "Your essay graded against the official IELTS Writing descriptors — with line-level feedback and a clear path to the next band.";
  const eyebrow = lang === "ru" ? "AI IELTS ЧЕКЕР" : "AI IELTS CHECKER";
  const modelsOnline = lang === "ru" ? "Модели онлайн" : "Models online";
  const footerLeft = lang === "ru"
    ? "IELTS Checker · оценки — это ориентир, не официальный балл"
    : "IELTS Checker · evaluations are guidance, not official scores";
  const footerRight = "v 2.0";

  return (
    <div className="app">
      <style>{`
        :root {
          --bg: #fafafa;
          --bg-elev: #ffffff;
          --bg-elev-2: #ffffff;
          --border: #e8e8eb;
          --border-strong: #d4d4d8;
          --text: #0a0a0b;
          --text-muted: #6b6f76;
          --text-dim: #9a9ea6;
          --accent: #1a1814;
          --accent-soft: rgba(26, 24, 20, 0.06);
          --accent-text: #1a1814;

          --c-task: oklch(0.58 0.10 25);
          --c-task-soft: oklch(0.95 0.02 25);
          --c-cohesion: oklch(0.55 0.09 290);
          --c-cohesion-soft: oklch(0.95 0.02 290);
          --c-lexical: oklch(0.55 0.08 160);
          --c-lexical-soft: oklch(0.96 0.02 160);
          --c-grammar: oklch(0.60 0.10 75);
          --c-grammar-soft: oklch(0.96 0.03 75);

          --font-display: "Instrument Serif", Georgia, serif;
          --font-sans: "Geist", "Inter Tight", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
          --font-label: "Geist", "Inter Tight", -apple-system, system-ui, sans-serif;

          --radius-sm: 8px;
          --radius: 14px;
          --radius-lg: 20px;
        }

        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: 1.55;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          font-feature-settings: "ss01", "cv01", "cv11";
        }
        button { font-family: inherit; color: inherit; border: none; background: none; cursor: pointer; }
        textarea, input { font-family: inherit; color: inherit; }
        ::selection { background: var(--accent-soft); color: var(--accent-text); }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
        }
        .app::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, var(--accent-soft), transparent 60%),
            radial-gradient(ellipse 60% 50% at 100% 100%, var(--accent-soft), transparent 70%);
          opacity: 0.4;
          z-index: 0;
        }
        .shell {
          position: relative;
          z-index: 1;
          max-width: 980px;
          margin: 0 auto;
          padding: 0 32px 80px;
          width: 100%;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(16px) saturate(140%);
          -webkit-backdrop-filter: blur(16px) saturate(140%);
          background: color-mix(in oklab, var(--bg) 75%, transparent);
          border-bottom: 1px solid var(--border);
        }
        .header-inner {
          max-width: 980px;
          margin: 0 auto;
          padding: 14px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand-mark {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: var(--accent);
          display: grid; place-items: center;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
        }
        .brand-mark svg { width: 16px; height: 16px; color: #fff; }
        .brand-name {
          font-family: var(--font-display);
          font-size: 21px;
          letter-spacing: -0.01em;
          font-weight: 400;
          line-height: 1;
          color: var(--text);
        }
        .brand-name em { font-style: italic; color: var(--accent-text); }
        .header-meta { display: flex; align-items: center; gap: 8px; }
        .pill-mini {
          font-family: var(--font-label);
          font-weight: 500;
          font-size: 10.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 5px 10px;
          border: 1px solid var(--border);
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-elev);
        }
        .pill-mini .dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: oklch(0.65 0.18 145);
          box-shadow: 0 0 0 3px oklch(0.65 0.18 145 / 0.18);
        }

        .hero {
          padding: 80px 0 40px;
          text-align: center;
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-label);
          font-weight: 500;
          font-size: 10.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 28px;
        }
        .hero-eyebrow::before {
          content: "";
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }
        .hero-title {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: clamp(48px, 7vw, 84px);
          line-height: 0.95;
          letter-spacing: -0.025em;
          margin: 0 0 22px;
          color: var(--text);
        }
        .hero-title em { font-style: italic; color: var(--accent-text); font-weight: 400; }
        .hero-sub {
          color: var(--text-muted);
          font-size: 16px;
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .card {
          background: var(--bg-elev);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          position: relative;
        }

        .footer {
          margin-top: 60px;
          padding-top: 28px;
          border-top: 1px solid var(--border);
          font-family: var(--font-label);
          font-weight: 500;
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .sec-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 0 4px;
          margin: 22px 0 -4px;
        }
        .sec-head h2 {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 400;
          letter-spacing: -0.01em;
          margin: 0;
          color: var(--text);
        }
        .sec-head .meta {
          font-family: var(--font-label);
          font-weight: 500;
          font-size: 10.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-dim);
        }

        /* Loading overlay */
        .loading {
          position: fixed;
          inset: 0;
          background: color-mix(in oklab, var(--bg) 70%, transparent);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 100;
          display: grid;
          place-items: center;
          animation: fadeIn 0.25s ease;
        }
        .loading-inner {
          width: min(420px, 90vw);
          padding: 36px 40px;
          background: var(--bg-elev);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .loading-inner::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(120deg, transparent 35%, var(--accent) 50%, transparent 65%);
          background-size: 250% 100%;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          animation: shimmer 2.2s linear infinite;
          pointer-events: none;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .loading-orb {
          width: 88px; height: 88px;
          margin: 0 auto 20px;
          position: relative;
        }
        .loading-orb svg {
          width: 100%; height: 100%;
          transform: rotate(-90deg);
        }
        .loading-orb-num {
          position: absolute; inset: 0;
          display: grid; place-items: center;
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }
        .loading-stage {
          font-family: var(--font-display);
          font-size: 22px;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
          font-weight: 400;
          color: var(--text);
        }
        .loading-stage em { font-style: italic; color: var(--accent-text); }
        .loading-step {
          font-family: var(--font-label);
          font-weight: 500;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-top: 16px;
          height: 14px;
        }
        .loading-steps {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin-top: 14px;
        }
        .loading-steps span {
          width: 24px; height: 2px;
          background: var(--border-strong);
          border-radius: 2px;
          transition: 0.25s;
        }
        .loading-steps span[data-active="true"] { background: var(--accent); }
        .loading-steps span[data-done="true"] { background: var(--accent-text); }

        /* Anim utility */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-item {
          opacity: 0;
          animation: fadeSlideUp 0.36s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-item { animation: none !important; opacity: 1 !important; }
        }

        @media (max-width: 720px) {
          .shell { padding: 0 20px 60px; }
          .hero { padding: 48px 0 28px; }
          .header-inner { padding: 12px 20px; }
        }
      `}</style>

      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5h11l3 3v11H5z" />
                <path d="M9 11h6M9 15h4" />
              </svg>
            </div>
            <div className="brand-name">IELTS <em>Checker</em></div>
          </div>
          <div className="header-meta">
            <span className="pill-mini"><span className="dot" /> {modelsOnline}</span>
            <SettingsModal lang={lang} setLang={setLang} s={s} />
          </div>
        </div>
      </header>

      <main className="shell">
        <section className="hero">
          <div className="hero-eyebrow">{eyebrow}</div>
          <h1 className="hero-title">{heroTitle}</h1>
          <p className="hero-sub">{heroSub}</p>
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
              marginTop: 16,
              padding: "13px 16px",
              borderRadius: 12,
              background: "color-mix(in oklab, oklch(0.65 0.15 25) 8%, var(--bg-elev))",
              border: "1px solid color-mix(in oklab, oklch(0.65 0.15 25) 25%, var(--border))",
              color: "oklch(0.4 0.15 25)",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <ResultsPanel
          result={result}
          taskMode={taskMode}
          loading={false}
          s={s}
          essay={essay}
          onImprove={improve}
          improvedEssay={improvedEssay}
          loadingImprove={loadingImprove}
          lang={lang}
        />

        <footer className="footer">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </footer>
      </main>

      {loading && <LoadingOverlay progress={progress} stageIdx={stageIdx} />}
    </div>
  );
}
