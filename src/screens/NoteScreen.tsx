import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import type { SleepEntry, SleepFactor } from "../types/sleep";

type NoteScreenProps = {
  factors: SleepFactor[];
  todayEntry?: SleepEntry;
  onSave: (data: Omit<SleepEntry, "date">) => void;
  onCreateFactor: (factor: SleepFactor) => SleepFactor;
  onDeleteFactor: (factor: SleepFactor) => void;
};

function factorKey(factor: SleepFactor) {
  return `${factor.emoji}::${factor.label}`;
}

const EMOJI_OPTIONS = [
  "🛌",
  "😴",
  "☕",
  "📱",
  "🧘",
  "🚶",
  "🏃",
  "🍽️",
  "🍷",
  "💧",
  "🌙",
  "🌧️",
  "😌",
  "😫",
  "🧠",
  "🎧",
  "📚",
  "💼",
];

export function NoteScreen({
  factors,
  todayEntry,
  onSave,
  onCreateFactor,
  onDeleteFactor,
}: NoteScreenProps) {
  const [hours, setHours] = useState(todayEntry?.hours ?? 7);
  const [quality, setQuality] = useState(todayEntry?.quality ?? 7);
  const [selectedFactors, setSelectedFactors] = useState<SleepFactor[]>(
    todayEntry?.factors ?? [],
  );
  const [emojiInput, setEmojiInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);

  useEffect(() => {
    setHours(todayEntry?.hours ?? 7);
    setQuality(todayEntry?.quality ?? 7);
    setSelectedFactors(todayEntry?.factors ?? []);
  }, [todayEntry]);

  useEffect(() => {
    const available = new Set(factors.map((factor) => factorKey(factor)));
    setSelectedFactors((prev) =>
      prev.filter((factor) => available.has(factorKey(factor))),
    );
  }, [factors]);

  const selectedKeys = useMemo(
    () => new Set(selectedFactors.map((factor) => factorKey(factor))),
    [selectedFactors],
  );

  function toggleFactor(factor: SleepFactor) {
    const key = factorKey(factor);

    setSelectedFactors((prev) => {
      const exists = prev.some((item) => factorKey(item) === key);
      if (exists) {
        return prev.filter((item) => factorKey(item) !== key);
      }
      return [...prev, factor];
    });
  }

  function handleCreateFactor() {
    const label = labelInput.trim();
    const emoji = emojiInput.trim() || "🛌";

    if (!label) return;

    const nextFactor = onCreateFactor({ emoji, label });
    setSelectedFactors((prev) => {
      const key = factorKey(nextFactor);
      const exists = prev.some((factor) => factorKey(factor) === key);
      if (exists) return prev;
      return [...prev, nextFactor];
    });
    setEmojiInput("");
    setLabelInput("");
  }

  function handleFactorInputEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleCreateFactor();
    }
  }

  return (
    <section className="screen">
      <h1 className="title">Запись сна</h1>

      <div className="card">
        <p className="label">Сколько часов спали</p>
        <div className="stepper">
          <button className="square-btn" onClick={() => setHours((prev) => Math.max(0, prev - 0.5))}>
            -
          </button>
          <div className="value">{hours.toFixed(1)}</div>
          <button className="square-btn" onClick={() => setHours((prev) => Math.min(24, prev + 0.5))}>
            +
          </button>
        </div>
      </div>

      <div className="card">
        <p className="label">Качество сна</p>
        <div className="quality-grid">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
            <button
              key={value}
              className={quality === value ? "quality-pill active" : "quality-pill"}
              onClick={() => setQuality(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="label">Факторы</p>

        <div className="factor-list">
          {factors.map((factor) => {
            const key = factorKey(factor);
            const selected = selectedKeys.has(key);

            return (
              <div key={key} className={selected ? "factor-chip active" : "factor-chip"}>
                <button
                  type="button"
                  className="factor-main"
                  onClick={() => toggleFactor(factor)}
                >
                  <span>{factor.emoji}</span>
                  <span>{factor.label}</span>
                </button>
                <button
                  type="button"
                  className="factor-delete"
                  aria-label={`Удалить фактор ${factor.label}`}
                  title="Удалить фактор"
                  onClick={() => onDeleteFactor(factor)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <div className="create-factor">
          <button
            type="button"
            className="input emoji-input emoji-trigger"
            onClick={() => setIsEmojiModalOpen(true)}
            aria-label="Выбрать эмодзи"
            title="Выбрать эмодзи"
          >
            {emojiInput || "😀"}
          </button>
          <input
            className="input"
            placeholder="Новый фактор"
            value={labelInput}
            onChange={(event) => setLabelInput(event.target.value)}
            onKeyDown={handleFactorInputEnter}
          />
          <button
            className="add-btn"
            onClick={handleCreateFactor}
            aria-label="Добавить фактор"
            title="Добавить фактор"
          >
            +
          </button>
        </div>
      </div>

      <button
        className="save-btn"
        onClick={() => onSave({ hours, quality, factors: selectedFactors })}
      >
        Сохранить
      </button>

      {isEmojiModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEmojiModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Выберите эмодзи</h2>
            <div className="emoji-modal-grid">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={emojiInput === emoji ? "emoji-option active" : "emoji-option"}
                  onClick={() => {
                    setEmojiInput(emoji);
                    setIsEmojiModalOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button className="close-btn" onClick={() => setIsEmojiModalOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
