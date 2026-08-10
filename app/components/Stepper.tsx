"use client";

type StepperProps = {
  steps: { key: string; label: string }[];
  current: number; // 0-based
  onJump?: (i: number) => void;
};

export function Stepper({ steps, current, onJump }: StepperProps) {
  return (
    <ol className="flex items-center gap-3 w-full" aria-label="操作步驟">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const enabled = onJump && (done || active);
        return (
          <li key={s.key} className="flex items-center gap-3 flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => enabled && onJump(i)}
              disabled={!enabled}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 ${enabled ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`stepper-dot ${active ? "active" : done ? "done" : ""}`}
                aria-hidden
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-sm font-medium ${
                  active ? "text-[var(--coral-deep)]" : done ? "text-[var(--navy)]" : "text-[var(--muted)]"
                }`}
              >
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                className={`stepper-line ${done ? "done" : ""}`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}