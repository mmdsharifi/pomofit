// Session management utilities

export function isPomodoroActive(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("pomofit-active-mode") === "pomodoro";
}

export function isRestSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  const mode = localStorage.getItem("pomofit-active-mode");
  return mode === "shortBreak" || mode === "longBreak";
}

export async function refreshAppData(): Promise<void> {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pomofit-daily-refresh"));
  }
}

export function getCurrentSession() {
  if (typeof window === "undefined") return null;
  const mode = localStorage.getItem("pomofit-active-mode");
  if (!mode) return null;
  return { mode };
}
