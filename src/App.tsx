import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { useSleepData } from "./hooks/useSleepData";
import { ChartScreen } from "./screens/ChartScreen";
import { NoteScreen } from "./screens/NoteScreen";
import type { SleepTab } from "./types/sleep";
import "./styles.css";

export default function App() {
  const [tab, setTab] = useState<SleepTab>("note");
  const [chartAnimationSeed, setChartAnimationSeed] = useState(0);
  const { entries, factors, saveEntry, addFactor, removeFactor } =
    useSleepData();

  function handleTabChange(nextTab: SleepTab) {
    if (nextTab === "chart" && nextTab !== tab) {
      setChartAnimationSeed((prev) => prev + 1);
    }
    setTab(nextTab);
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        <div className="content-area">
          {tab === "note" ? (
            <NoteScreen
              entries={entries}
              factors={factors}
              onSave={saveEntry}
              onCreateFactor={addFactor}
              onDeleteFactor={removeFactor}
            />
          ) : (
            <ChartScreen entries={entries} animationSeed={chartAnimationSeed} />
          )}
        </div>

        <BottomNav activeTab={tab} onChange={handleTabChange} />
      </div>
    </main>
  );
}
