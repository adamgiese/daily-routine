import { useEffect, useMemo, useRef, useState } from "react";

// ---- Config (hardcoded route) ----
const TODOS = [
  "Take meds",
  "Do stretches",
  "Drink water (with fiber)",
  "Read non-fiction",
  "Budget",
  "Tidy something!",
  "Reach out to somebody",
  "Get some movement",
  "Write for blog",
];
const STORAGE_PREFIX = "routeReact-";

// Hidden 3:00 AM service-day reset
function getServiceDayId(d = new Date()) {
  const now = new Date(d);
  const start = new Date(now);
  start.setHours(3, 0, 0, 0);
  if (now < start) start.setDate(start.getDate() - 1);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const storageKeyFor = (dayId) => `${STORAGE_PREFIX}${dayId}`;

function loadState(dayId) {
  try {
    const raw = localStorage.getItem(storageKeyFor(dayId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { checked: [], undoStack: [], total: TODOS.length };
}
const saveState = (dayId, state) =>
  localStorage.setItem(storageKeyFor(dayId), JSON.stringify(state));

export default function RouteMicroapp() {
  const [dayId, setDayId] = useState(getServiceDayId());
  const [state, setState] = useState(() => loadState(getServiceDayId()));
  const intervalRef = useRef(null);

  // Rollover at boundary
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const newId = getServiceDayId();
      if (newId !== dayId) {
        setDayId(newId);
        setState(loadState(newId));
      }
    }, 60_000);
    return () => clearInterval(intervalRef.current);
  }, [dayId]);

  // Persist
  useEffect(() => saveState(dayId, state), [dayId, state]);

  // First unchecked
  const firstUncheckedIndex = useMemo(() => {
    for (let i = 0; i < TODOS.length; i++) if (!state.checked.includes(i)) return i;
    return -1;
  }, [state]);

  const progressPct = Math.round((state.checked.length / TODOS.length) * 100);

  function completeCurrent() {
    if (firstUncheckedIndex === -1) return;
    if (!state.checked.includes(firstUncheckedIndex)) {
      setState((s) => ({
        ...s,
        checked: [...s.checked, firstUncheckedIndex],
        undoStack: [...s.undoStack, firstUncheckedIndex],
      }));
    }
  }
  function undoLast() {
    if (!state.undoStack.length) return;
    const idx = state.undoStack[state.undoStack.length - 1];
    const newUndo = state.undoStack.slice(0, -1);
    const newChecked = state.checked.slice();
    const pos = newChecked.lastIndexOf(idx);
    if (pos !== -1) newChecked.splice(pos, 1);
    setState({ ...state, undoStack: newUndo, checked: newChecked });
  }

  return (
    <div
      className="
        min-h-[100dvh] w-full overflow-x-hidden
        bg-[#0f0f12] text-[#eef0f4]
        flex items-center justify-center
        px-4
        pt-[max(env(safe-area-inset-top),0.75rem)]
        pb-[max(env(safe-area-inset-bottom),1.25rem)]
      "
    >
      <main
        role="region"
        aria-label="Route microapp"
        className="
          w-full max-w-[560px]
          rounded-2xl border border-white/10
          bg-gradient-to-b from-[#181a21] to-[#121318]
          shadow-xl
          p-6 sm:p-7
          overflow-hidden
          flex flex-col
          min-h-[320px]
        "
      >
        {firstUncheckedIndex === -1 ? (
          <div className="grid gap-4 text-left">
            <h1 className="text-[clamp(22px,6vw,28px)] font-extrabold text-[#7ee787]">
              All done for today 🎉
            </h1>
            <div className="text-sm text-[#8b90a1] leading-6">
              {TODOS.map((t, i) => (
                <div key={i}>{state.checked.includes(i) ? "✅" : "⬜"} {t}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mt-auto">
              <button
                onClick={undoLast}
                disabled={state.undoStack.length === 0}
                className="
                  rounded-xl px-5 py-4
                  border border-dashed border-[#2a2d37]
                  text-[#8b90a1] font-semibold
                  disabled:opacity-50
                  active:translate-y-px
                "
                aria-label="Undo last completed"
              >
                Undo
              </button>
              <button
                disabled
                className="
                  rounded-xl px-5 py-4 font-bold
                  bg-[#6ae3ff] text-[#0a0c10] opacity-50
                "
                aria-label="Complete"
              >
                Complete
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <h1 className="text-[clamp(26px,8vw,40px)] font-bold leading-tight">
              {TODOS[firstUncheckedIndex]}
            </h1>

            <div className="text-xs text-[#8b90a1]">
              {state.checked.length}/{TODOS.length} done • {progressPct}%
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mt-auto">
              <button
                onClick={completeCurrent}
                className="
                  rounded-xl px-5 py-4 text-base font-bold
                  bg-[#6ae3ff] text-[#0a0c10]
                  active:translate-y-px transition
                "
                aria-label="Complete current task"
              >
                Complete
              </button>
              <button
                onClick={undoLast}
                disabled={state.undoStack.length === 0}
                className="
                  rounded-xl px-5 py-4 text-base font-semibold
                  border border-dashed border-[#2a2d37] text-[#8b90a1]
                  disabled:opacity-50 active:translate-y-px
                "
                aria-label="Undo last completed"
              >
                Undo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
