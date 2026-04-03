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
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "absolute", top: 0, right: 0 }}>
      <button
        className="gear-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: open ? "#f3f4f6" : "#fff",
          color: open ? "#6366f1" : "#6b7280",
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <GearIcon />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "16px 18px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            minWidth: 200,
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "#111827",
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            {s.settingsTitle}
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              {s.languageLabel}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                background: "#f3f4f6",
                borderRadius: 8,
                padding: 3,
              }}
            >
              {(["en", "ru"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: lang === l ? "#6366f1" : "transparent",
                    color: lang === l ? "#fff" : "#6b7280",
                    transition: "all 0.15s ease",
                    fontFamily: "inherit",
                  }}
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
