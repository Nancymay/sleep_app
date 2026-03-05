import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { SleepEntry, SleepFactor } from "../types/sleep";

const ENTRIES_KEY = "sleep-tracker.entries";
const FACTORS_KEY = "sleep-tracker.factors";

const DEFAULT_FACTORS: SleepFactor[] = [
  { emoji: "🧘", label: "Йога" },
  { emoji: "☕", label: "Кофе" },
  { emoji: "📱", label: "Поздний экран" },
];

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  return toLocalDateString(new Date());
}

export function useSleepData() {
  const [entries, setEntries] = useLocalStorage<SleepEntry[]>(ENTRIES_KEY, []);
  const [factors, setFactors] = useLocalStorage<SleepFactor[]>(
    FACTORS_KEY,
    DEFAULT_FACTORS,
  );

  const todayEntry = useMemo(() => {
    const today = getTodayDate();
    return entries.find((entry) => entry.date === today);
  }, [entries]);

  function saveEntry(date: string, data: Omit<SleepEntry, "date">) {
    setEntries((prev) => {
      const filtered = prev.filter((entry) => entry.date !== date);
      const next = [...filtered, { ...data, date }];
      return next.sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  function addFactor(newFactor: SleepFactor): SleepFactor {
    const emoji = newFactor.emoji.trim();
    const label = newFactor.label.trim();

    if (!emoji || !label) return { emoji: "🛌", label: "Без названия" };

    let resolvedFactor: SleepFactor = { emoji, label };

    setFactors((prev) => {
      const existing = prev.find(
        (factor) =>
          factor.emoji === emoji &&
          factor.label.toLowerCase() === label.toLowerCase(),
      );

      if (existing) {
        resolvedFactor = existing;
        return prev;
      }

      resolvedFactor = { emoji, label };
      return [...prev, { emoji, label }];
    });

    return resolvedFactor;
  }

  function removeFactor(factorToRemove: SleepFactor) {
    const emoji = factorToRemove.emoji.trim();
    const label = factorToRemove.label.trim().toLowerCase();

    setFactors((prev) =>
      prev.filter(
        (factor) =>
          !(factor.emoji === emoji && factor.label.trim().toLowerCase() === label),
      ),
    );
  }

  return {
    entries,
    factors,
    todayEntry,
    saveEntry,
    addFactor,
    removeFactor,
  };
}
