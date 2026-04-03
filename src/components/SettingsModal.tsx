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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            top: "calc(100% + 10px)",
            background: "#fff",
            border: "1.5px solid rgba(0,0,0,0.07)",
            borderRadius: 18,
            padding: "18px 20px",
            boxShadow: "6px 6px 0 rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.1)",
            minWidth: 210,
            zIndex: 200,
          }}
        >
          <div
            style={{
              fontFamily: "'Nunito', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: 14,
              color: "#2D2D2D",
              marginBottom: 14,
              paddingBottom: 12,
              borderBottom: "1.5px solid rgba(0,0,0,0.06)",
            }}
          >
            {s.settingsTitle}
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#aaa",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 8,
                fontFamily: "'Nunito', system-ui, sans-serif",
              }}
            >
              {s.languageLabel}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                background: "#F0ECF8",
                borderRadius: 12,
                padding: 4,
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
              }}
            >
              {(["en", "ru"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => { setLang(l); setOpen(false); }}
                  style={{
                    flex: 1,
                    padding: "7px 12px",
                    borderRadius: 9,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Nunito', system-ui, sans-serif",
                    background: lang === l
                      ? "linear-gradient(145deg, #9D94FF, #7B6FFF)"
                      : "transparent",
                    color: lang === l ? "#fff" : "#888",
                    boxShadow: lang === l ? "3px 3px 0 #4A3FC0, inset 0 1px 3px rgba(255,255,255,0.3)" : "none",
                    transition: "all 0.15s ease",
                  }}
                  aria-pressed={lang === l}
                >
                  {l === "en" ? s.langEn : s.langRu}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
