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
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function TaskForm({
  taskMode,
  onTaskChange,
  question,
  setQuestion,
  essay,
  setEssay,
  image,
  imagePreview,
  onImageChange,
  loading,
  isReady,
  onSubmit,
  s,
}: Props) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const minWords = taskMode === "task1" ? 150 : 250;
  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const wordCountOk = wordCount >= minWords;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageChange(file, URL.createObjectURL(file));
    e.target.value = "";
  };

  const inputFocusStyle = (field: string): React.CSSProperties =>
    focusedField === field
      ? { borderColor: "#7B6FFF", boxShadow: "0 0 0 4px rgba(123,111,255,0.12), inset 0 2px 4px rgba(0,0,0,0.04)" }
      : {};

  const essayTextarea = (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label className="field-label" htmlFor="essay-input">{s.essayLabel}</label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: wordCountOk ? "#ECFDF5" : wordCount > 0 ? "#FFF1F0" : "#F5F5F5",
            border: `1.5px solid ${wordCountOk ? "#3EC99A" : wordCount > 0 ? "#FF6B5B" : "#e5e7eb"}`,
            borderRadius: 999,
            padding: "3px 12px",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: wordCountOk ? "#2BA87E" : wordCount > 0 ? "#C94B3B" : "#9ca3af", fontFamily: "'Nunito', system-ui, sans-serif" }}>
            {s.words(wordCount)}
          </span>
          {wordCount > 0 && !wordCountOk && (
            <span style={{ fontSize: 12, color: "#C94B3B", fontWeight: 600 }}>
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
        className="clay-input"
        style={{ ...inputFocusStyle("essay") }}
        aria-label={s.essayLabel}
      />
    </div>
  );

  return (
    <div
      className="clay-white"
      style={{ padding: "28px 28px 24px", marginBottom: 20 }}
    >
      <TaskToggle taskMode={taskMode} onChange={onTaskChange} s={s} />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                className="clay-input"
                style={{ ...inputFocusStyle("question") }}
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
                <div style={{ border: "2px solid rgba(0,0,0,0.07)", borderRadius: 16, overflow: "hidden", background: "#FAFAFA" }}>
                  <img
                    src={imagePreview}
                    alt="Uploaded chart"
                    style={{ width: "100%", maxHeight: 280, objectFit: "contain", display: "block", background: "#fff" }}
                  />
                  <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                      {image?.name}
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#7B6FFF",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 10px",
                        borderRadius: 8,
                        fontFamily: "'Nunito', system-ui, sans-serif",
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
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  aria-label={s.imagePlaceholder}
                >
                  <UploadIcon />
                  <span style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Nunito', system-ui, sans-serif" }}>
                    {s.imagePlaceholder}
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                style={{ display: "none" }}
                aria-hidden="true"
              />
            </div>
            {essayTextarea}
          </>
        )}

        <button
          className={`btn-clay btn-primary-clay`}
          onClick={onSubmit}
          disabled={loading || !isReady}
          style={{ width: "100%", fontSize: 16 }}
          aria-busy={loading}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  border: "2.5px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              {s.checkingBtn}
            </span>
          ) : s.checkBtn}
        </button>
      </div>
    </div>
  );
}
