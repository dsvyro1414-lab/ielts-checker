import { useState, useRef } from "react";
import type { TaskMode } from "../types";
import type { Strings } from "../hooks/useLanguage";

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

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const target = taskMode === "task2" ? 250 : 150;
  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const wcState =
    wordCount === 0 ? "empty"
    : wordCount < target * 0.8 ? "warn"
    : wordCount > target * 2.5 ? "warn"
    : "good";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageChange(file, URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageChange(file, URL.createObjectURL(file));
    }
  };

  return (
    <>
      <style>{`
        .form-card { padding: 28px; margin-top: 36px; }
        .tabs {
          display: inline-flex;
          padding: 4px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          gap: 2px;
        }
        .tab {
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          border-radius: 8px;
          transition: 0.16s;
          font-family: var(--font-sans);
          min-height: 36px;
        }
        .tab[data-active="true"] {
          color: var(--text);
          background: var(--bg-elev-2);
          box-shadow: 0 1px 0 var(--border-strong), 0 2px 8px -2px rgba(0,0,0,0.08);
        }
        .field { margin-top: 24px; }
        .field-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 10px;
        }
        .label {
          font-family: var(--font-label);
          font-weight: 500;
          font-size: 10.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .word-count {
          font-family: var(--font-mono);
          font-size: 11.5px;
          color: var(--text-dim);
        }
        .word-count strong { color: var(--text); font-weight: 500; }
        .word-count[data-state="good"] strong { color: var(--accent-text); }
        .word-count[data-state="warn"] strong { color: oklch(0.55 0.16 50); }
        .word-count .req { color: var(--text-dim); }

        textarea.input {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px 18px;
          color: var(--text);
          font-size: 15px;
          line-height: 1.6;
          font-family: var(--font-sans);
          resize: vertical;
          transition: 0.18s;
        }
        textarea.input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-soft);
        }
        textarea.input::placeholder { color: var(--text-dim); }
        textarea.task-input { min-height: 88px; }
        textarea.essay-input { min-height: 280px; }

        .upload-zone {
          width: 100%;
          background: var(--bg);
          border: 1.5px dashed var(--border-strong);
          border-radius: var(--radius);
          padding: 36px 20px;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.18s;
          min-height: 130px;
        }
        .upload-zone:hover, .upload-zone[data-drag="true"] {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--text);
        }
        .image-preview {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--bg);
        }

        .submit-row {
          margin-top: 26px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .helper {
          font-size: 12.5px;
          color: var(--text-dim);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .kbd {
          font-family: var(--font-mono);
          font-size: 10.5px;
          padding: 2px 6px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-bottom-width: 2px;
          border-radius: 5px;
          color: var(--text-muted);
        }

        .btn-primary {
          position: relative;
          padding: 13px 28px;
          border-radius: 12px;
          background: var(--accent);
          color: #fafafa;
          font-weight: 500;
          font-size: 14px;
          letter-spacing: -0.005em;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: 0.18s;
          min-height: 46px;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            0 8px 24px -8px var(--accent),
            0 0 0 1px color-mix(in oklab, var(--accent) 70%, #000);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.15);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-primary svg { width: 14px; height: 14px; }

        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @media (max-width: 720px) {
          .form-card { padding: 22px; }
          .submit-row { flex-direction: column; align-items: stretch; }
          .submit-row .btn-primary { justify-content: center; }
        }
      `}</style>

      <div className="form-card card">
        <div className="tabs" role="tablist" aria-label="Task type">
          <button
            role="tab"
            className="tab"
            data-active={taskMode === "task2"}
            onClick={() => onTaskChange("task2")}
            aria-selected={taskMode === "task2"}
          >
            Task 2 — Essay
          </button>
          <button
            role="tab"
            className="tab"
            data-active={taskMode === "task1"}
            onClick={() => onTaskChange("task1")}
            aria-selected={taskMode === "task1"}
          >
            Task 1 — Report
          </button>
        </div>

        {taskMode === "task2" ? (
          <div className="field">
            <div className="field-head">
              <span className="label">{s.questionLabel}</span>
              <span className="word-count req">Required</span>
            </div>
            <textarea
              id="question-input"
              className="input task-input"
              value={question}
              placeholder={s.questionPlaceholder}
              onChange={(e) => setQuestion(e.target.value)}
              aria-label={s.questionLabel}
            />
          </div>
        ) : (
          <div className="field">
            <div className="field-head">
              <span className="label">{s.imageLabel}</span>
              <span className="word-count req">Required</span>
            </div>
            {imagePreview ? (
              <div className="image-preview">
                <img
                  src={imagePreview}
                  alt="Uploaded chart"
                  style={{ width: "100%", maxHeight: 280, objectFit: "contain", display: "block", background: "var(--bg-elev-2)" }}
                />
                <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                    {image?.name}
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "var(--accent-text)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontFamily: "var(--font-label)",
                    }}
                  >
                    {s.imageChange}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="upload-zone"
                data-drag={dragOver}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                aria-label={s.imagePlaceholder}
              >
                <UploadIcon />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{s.imagePlaceholder}</span>
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
        )}

        <div className="field">
          <div className="field-head">
            <span className="label">{s.essayLabel}</span>
            <span className="word-count" data-state={wcState}>
              <strong>{wordCount}</strong> / {target}+ {s.words(0).split(" ").pop()}
            </span>
          </div>
          <textarea
            id="essay-input"
            className="input essay-input"
            value={essay}
            placeholder={s.essayPlaceholder}
            onChange={(e) => setEssay(e.target.value)}
            aria-label={s.essayLabel}
          />
        </div>

        <div className="submit-row">
          <div className="helper">
            <span>{s.pressLabel}</span>
            <span className="kbd">⌘</span>
            <span className="kbd">↵</span>
            <span>{s.toEvaluate}</span>
          </div>
          <button
            className="btn-primary"
            onClick={onSubmit}
            disabled={loading || !isReady}
            aria-busy={loading}
          >
            {loading ? <span className="spinner" /> : <SparkIcon />}
            {loading ? s.checkingBtn : s.checkBtn}
            {!loading && <ArrowIcon />}
          </button>
        </div>
      </div>
    </>
  );
}
