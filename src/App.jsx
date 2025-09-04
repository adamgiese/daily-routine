import { useEffect, useMemo, useRef, useState } from "react";

// --- Config ---
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

// Day id with hidden 3:00 AM reset
function getServiceDayId(d = new Date()) {
  const now = new Date(d);
  const start = new Date(now);
  start.setHours(3, 0, 0, 0); // hidden reset time
  if (now < start) start.setDate(start.getDate() - 1);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function storageKeyFor(dayId) {
  return `${STORAGE_PREFIX}${dayId}`;
}

function loadState(dayId) {
  try {
    const raw = localStorage.getItem(storageKeyFor(dayId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { checked: [], undoStack: [], total: TODOS.length };
}

function saveState(dayId, state) {
  localStorage.setItem(storageKeyFor(dayId), JSON.stringify(state));
}

export default function RouteMicroapp() {
  const [dayId, setDayId] = useState(getServiceDayId());
  const [state, setState] = useState(() => loadState(getServiceDayId()));
  const intervalRef = useRef(null);

  // Rollover watcher at reset boundary
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

  // Persist on change
  useEffect(() => saveState(dayId, state), [dayId, state]);

  const firstUncheckedIndex = useMemo(() => {
    for (let i = 0; i < TODOS.length; i++) {
      if (!state.checked.includes(i)) return i;
    }
    return -1;
  }, [state]);

  const progressPct = Math.round((state.checked.length / TODOS.length) * 100);

  function completeCurrent() {
    if (firstUncheckedIndex === -1) return;
    if (!state.checked.includes(firstUncheckedIndex)) {
      const next = {
        ...state,
        checked: [...state.checked, firstUncheckedIndex],
        undoStack: [...state.undoStack, firstUncheckedIndex],
      };
      setState(next);
    }
  }

  function undoLast() {
    if (!state.undoStack.length) return;
    const idx = state.undoStack[state.undoStack.length - 1];
    const newUndo = state.undoStack.slice(0, -1);
    const pos = state.checked.lastIndexOf(idx);
    const newChecked = state.checked.slice();
    if (pos !== -1) newChecked.splice(pos, 1);
    setState({ ...state, undoStack: newUndo, checked: newChecked });
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0f0f12] text-[#eef0f4] flex items-center justify-center px-4">
      <main
        role="region"
        aria-label="Route microapp"
        className="w-full max-w-[480px] bg-gradient-to-b from-[#181a21] to-[#121318] border border-[#242731] rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col min-h-[320px]"
      >
        {firstUncheckedIndex === -1 ? (
          <div className="grid gap-4 text-left pt-2 min-h-[220px]">
            <div className="text-[clamp(22px,5vw,28px)] font-extrabold text-[#7ee787]">
              All done for today 🎉
            </div>
            <div className="text-sm text-[#8b90a1] leading-6">
              {TODOS.map((t, i) => (
                <div key={i}>{state.checked.includes(i) ? "✅" : "⬜"} {t}</div>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 mt-auto">
              <button
                onClick={undoLast}
                disabled={state.undoStack.length === 0}
                className="border border-dashed border-[#2a2d37] text-[#8b90a1] font-semibold rounded-xl px-4 py-3 disabled:opacity-50"
                aria-label="Undo last completed"
              >
                Undo
              </button>
              <button
                disabled
                className="bg-[#6ae3ff] text-[#0a0c10] font-bold rounded-xl px-4 py-3 opacity-50"
                aria-label="Complete"
              >
                Complete
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 min-h-[220px]">
            <div className="text-[clamp(24px,6vw,36px)] font-bold tracking-[0.2px] leading-tight">
              {TODOS[firstUncheckedIndex]}
            </div>
            <div className="text-xs text-[#8b90a1]">
              {state.checked.length}/{TODOS.length} done • {progressPct}%
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 mt-auto">
              <button
                onClick={completeCurrent}
                className="bg-[#6ae3ff] hover:bg-[#49c6e6] text-[#0a0c10] font-bold rounded-xl px-4 py-3 active:translate-y-px transition"
                aria-label="Complete current task"
              >
                Complete
              </button>
              <button
                onClick={undoLast}
                disabled={state.undoStack.length === 0}
                className="border border-dashed border-[#2a2d37] text-[#8b90a1] font-semibold rounded-xl px-4 py-3 disabled:opacity-50"
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