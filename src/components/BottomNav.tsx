import type { SleepTab } from "../types/sleep";

type BottomNavProps = {
  activeTab: SleepTab;
  onChange: (tab: SleepTab) => void;
};

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button
        className={activeTab === "note" ? "tab-button active" : "tab-button"}
        onClick={() => onChange("note")}
      >
        Запись
      </button>
      <button
        className={activeTab === "chart" ? "tab-button active" : "tab-button"}
        onClick={() => onChange("chart")}
      >
        График
      </button>
    </nav>
  );
}
