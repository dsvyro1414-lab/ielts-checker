import type { TaskMode } from "../types";
import type { Strings } from "../hooks/useLanguage";

interface Props {
  taskMode: TaskMode;
  onChange: (mode: TaskMode) => void;
  s: Pick<Strings, "t1" | "t2">;
}

export function TaskToggle({ taskMode, onChange, s }: Props) {
  return (
    <div className="task-toggle" role="tablist" aria-label="Task type">
      {(["task2", "task1"] as TaskMode[]).map((mode) => (
        <button
          key={mode}
          role="tab"
          aria-selected={taskMode === mode}
          className={`task-tab${taskMode === mode ? " active" : ""}`}
          onClick={() => onChange(mode)}
        >
          {mode === "task1" ? s.t1 : s.t2}
        </button>
      ))}
    </div>
  );
}
