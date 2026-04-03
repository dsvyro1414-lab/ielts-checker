import { useState, useRef, useEffect } from "react";
import type { Lang } from "../types";
import type { Strings } from "../hooks/useLanguage";

interface Props {
  lang: Lang;
  setLang: (lang: Lang) => void;
  s: Pick<Strings, "settingsTitle" | "languageLabel" | "langEn" | "langRu">;
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function SettingsModal({ lang, setLang, s }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="gear-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <GearIcon />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={s.settingsTitle}
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
            minWidth: 200,
            zIndex: 200,
          }}
        >
          <div style={{
            fontFamily: "'Nunito', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: 13,
            color: "var(--text-primary)",
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
          }}>
            {s.settingsTitle}
          </div>

          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: 0.9,
            marginBottom: 8,
            fontFamily: "'Nunito', system-ui, sans-serif",
          }}>
            {s.languageLabel}
          </div>

          <div style={{
            display: "flex",
            gap: 4,
            background: "#F2EFEA",
            borderRadius: 9,
            padding: 3,
            border: "1px solid var(--border)",
          }}>
            {(["en", "ru"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); setOpen(false); }}
                aria-pressed={lang === l}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Nunito', system-ui, sans-serif",
                  background: lang === l ? "#fff" : "transparent",
                  color: lang === l ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: lang === l ? "var(--shadow-sm)" : "none",
                  transition: "all 0.15s ease",
                  minHeight: 36,
                }}
              >
                {l === "en" ? s.langEn : s.langRu}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
