import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { useSleepData } from "./hooks/useSleepData";
import { ChartScreen } from "./screens/ChartScreen";
import { NoteScreen } from "./screens/NoteScreen";
import type { SleepTab } from "./types/sleep";
import "./styles.css";

export default function App() {
  const [tab, setTab] = useState<SleepTab>("note");
  const { entries, factors, todayEntry, saveTodayEntry, addFactor, removeFactor } =
    useSleepData();

  return (
    <main className="app-shell">
      <div className="phone-frame">
        <div className="content-area">
          {tab === "note" ? (
            <NoteScreen
              factors={factors}
              todayEntry={todayEntry}
              onSave={saveTodayEntry}
              onCreateFactor={addFactor}
              onDeleteFactor={removeFactor}
            />
          ) : (
            <ChartScreen entries={entries} />
          )}
        </div>

        <BottomNav activeTab={tab} onChange={setTab} />
      </div>
    </main>
  );
}
