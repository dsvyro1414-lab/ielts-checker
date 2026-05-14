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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
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
      <style>{`
        .icon-btn {
          width: 34px; height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: var(--text-muted);
          border: 1px solid var(--border);
          background: var(--bg-elev);
          transition: 0.18s;
          cursor: pointer;
        }
        .icon-btn:hover { color: var(--text); border-color: var(--border-strong); }
        .icon-btn[aria-expanded="true"] { color: var(--text); border-color: var(--border-strong); background: var(--accent-soft); }
      `}</style>
      <button
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={s.settingsTitle}
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
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 12px 32px -8px rgba(10,10,11,0.18), 0 2px 6px rgba(10,10,11,0.06)",
            minWidth: 220,
            zIndex: 200,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-label)",
              fontWeight: 500,
              fontSize: 10.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 14,
              paddingBottom: 12,
              borderBottom: "1px solid var(--border)",
            }}
          >
            {s.settingsTitle}
          </div>

          <div
            style={{
              fontFamily: "var(--font-label)",
              fontSize: 10.5,
              fontWeight: 500,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              marginBottom: 10,
            }}
          >
            {s.languageLabel}
          </div>

          <div
            style={{
              display: "flex",
              gap: 2,
              background: "var(--bg)",
              borderRadius: 10,
              padding: 4,
              border: "1px solid var(--border)",
            }}
          >
            {(["en", "ru"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); setOpen(false); }}
                aria-pressed={lang === l}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  background: lang === l ? "var(--bg-elev-2)" : "transparent",
                  color: lang === l ? "var(--text)" : "var(--text-muted)",
                  boxShadow: lang === l ? "0 1px 0 var(--border-strong), 0 2px 8px -2px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.16s ease",
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
