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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageChange(file, URL.createObjectURL(file));
    e.target.value = "";
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1.5px solid ${focusedField === field ? "#6366f1" : "#e5e7eb"}`,
    fontSize: 14,
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
    lineHeight: 1.6,
    background: "#fff",
    color: "#111827",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
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
            background: wordCount >= minWords ? "#f0fdf4" : wordCount > 0 ? "#fef2f2" : "#f9fafb",
            border: `1px solid ${wordCount >= minWords ? "#bbf7d0" : wordCount > 0 ? "#fecaca" : "#e5e7eb"}`,
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: wordCount >= minWords ? "#16a34a" : wordCount > 0 ? "#dc2626" : "#9ca3af",
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
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        padding: "24px 28px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        marginBottom: 16,
      }}
    >
      <TaskToggle taskMode={taskMode} onChange={onTaskChange} s={s} />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {taskMode === "task2" ? (
          <>
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
            {essayTextarea}
          </>
        ) : (
          <>
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
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
            {essayTextarea}
          </>
        )}

        <button
          className="btn-primary"
          onClick={onSubmit}
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
            fontFamily: "inherit",
          }}
        >
          {loading ? s.checkingBtn : s.checkBtn}
        </button>
      </div>
    </div>
  );
}
