import { useState, useRef } from "react";
import type { TaskMode } from "../types";
import type { Strings } from "../hooks/useLanguage";
import { TaskToggle } from "./TaskToggle";

interface Props {
  taskMode: TaskMode;
  onTaskChange: (mode: TaskMode) => void;
  question: string;
  setQuestion: (v: string) => void;
  essay: string;
  setEssay: (v: string) => void;
  image: File | null;
  imagePreview: string | null;
  onImageChange: (file: File, preview: string) => void;
  loading: boolean;
  isReady: boolean;
  onSubmit: () => void;
  s: Strings;
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function TaskForm({
  taskMode, onTaskChange, question, setQuestion, essay, setEssay,
  image, imagePreview, onImageChange, loading, isReady, onSubmit, s,
}: Props) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const minWords = taskMode === "task1" ? 150 : 250;
  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const wordCountOk = wordCount >= minWords;

  // Three-state word counter: gray (0) → red (<150) → neutral (150–249) → green (250+)
  const wc = wordCount === 0
    ? { color: "var(--text-muted)", bg: "#F5F3EF", border: "var(--border)" }
    : wordCount < 150
    ? { color: "#C0392B", bg: "#FDF3F2", border: "#EDCDC9" }
    : wordCount >= 250
    ? { color: "#4A7C59", bg: "#EEF4EE", border: "#C8DAC9" }
    : { color: "var(--text-secondary)", bg: "#F5F3EF", border: "var(--border)" };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageChange(file, URL.createObjectURL(file));
    e.target.value = "";
  };

  const focusStyle = (field: string): React.CSSProperties =>
    focusedField === field
      ? { borderColor: "var(--border-focus)", boxShadow: "0 0 0 3px rgba(124,154,126,0.15)", background: "#fff" }
      : {};

  const essayTextarea = (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <label className="field-label" htmlFor="essay-input">{s.essayLabel}</label>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "2px 10px",
          borderRadius: 999,
          border: `1px solid ${wc.border}`,
          background: wc.bg,
          transition: "background 0.2s, border-color 0.2s",
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Nunito', system-ui, sans-serif",
            color: wc.color,
            transition: "color 0.2s",
          }}>
            {s.words(wordCount)}
          </span>
          {wordCount > 0 && !wordCountOk && (
            <span style={{ fontSize: 11, color: wc.color, fontWeight: 600, opacity: 0.8 }}>
              {s.minWords(minWords)}
            </span>
          )}
        </div>
      </div>
      <textarea
        id="essay-input"
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        onFocus={() => setFocusedField("essay")}
        onBlur={() => setFocusedField(null)}
        placeholder={s.essayPlaceholder}
        rows={12}
        className="field-input"
        style={focusStyle("essay")}
        aria-label={s.essayLabel}
      />
    </div>
  );

  return (
    <div className="card" style={{ padding: "24px 24px 20px", marginBottom: 16 }}>
      <TaskToggle taskMode={taskMode} onChange={onTaskChange} s={s} />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {taskMode === "task2" ? (
          <>
            <div>
              <label className="field-label" htmlFor="question-input">{s.questionLabel}</label>
              <textarea
                id="question-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onFocus={() => setFocusedField("question")}
                onBlur={() => setFocusedField(null)}
                placeholder={s.questionPlaceholder}
                rows={3}
                className="field-input"
                style={focusStyle("question")}
                aria-label={s.questionLabel}
              />
            </div>
            {essayTextarea}
          </>
        ) : (
          <>
            <div>
              <label className="field-label">{s.imageLabel}</label>
              {imagePreview ? (
                <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "#FAFAFA" }}>
                  <img src={imagePreview} alt="Uploaded chart" style={{ width: "100%", maxHeight: 260, objectFit: "contain", display: "block", background: "#fff" }} />
                  <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                      {image?.name}
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: 13, fontWeight: 700, color: "var(--sage)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontFamily: "'Nunito', system-ui, sans-serif" }}
                    >
                      {s.imageChange}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  aria-label={s.imagePlaceholder}
                >
                  <UploadIcon />
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Nunito', system-ui, sans-serif" }}>
                    {s.imagePlaceholder}
                  </span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFileChange} style={{ display: "none" }} aria-hidden="true" />
            </div>
            {essayTextarea}
          </>
        )}

        <button
          className="btn-primary"
          onClick={onSubmit}
          disabled={loading || !isReady}
          aria-busy={loading}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
              {s.checkingBtn}
            </span>
          ) : s.checkBtn}
        </button>
      </div>
    </div>
  );
}
