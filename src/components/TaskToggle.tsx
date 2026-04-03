import type { TaskMode } from "../types";
import type { Strings } from "../hooks/useLanguage";

interface Props {
  taskMode: TaskMode;
  onChange: (mode: TaskMode) => void;
  s: Pick<Strings, "t1" | "t2">;
}

export function TaskToggle({ taskMode, onChange, s }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 24,
        background: "#f3f4f6",
        padding: 4,
        borderRadius: 10,
      }}
    >
      {(["task2", "task1"] as TaskMode[]).map((mode) => (
        <button
          key={mode}
          className="task-tab"
          onClick={() => onChange(mode)}
          style={{
            flex: 1,
            padding: "9px 16px",
            borderRadius: 7,
            border: "none",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            background: taskMode === mode ? "#fff" : "transparent",
            color: taskMode === mode ? "#6366f1" : "#6b7280",
            boxShadow: taskMode === mode ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s ease",
            fontFamily: "inherit",
          }}
        >
          {mode === "task1" ? s.t1 : s.t2}
        </button>
      ))}
    </div>
  );
}
