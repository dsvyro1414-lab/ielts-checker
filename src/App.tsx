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
          <SettingsModal lang={lang} setLang={setLang} s={s} />

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
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6366f1", letterSpacing: 0.5 }}>
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
          <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>{s.subtitle}</p>
        </div>

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

        <ResultsPanel result={result} taskMode={taskMode} loading={loading} s={s} />
      </div>
    </div>
  );
}
