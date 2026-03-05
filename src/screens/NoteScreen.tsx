import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import type { SleepEntry, SleepFactor } from "../types/sleep";

type NoteScreenProps = {
  entries: SleepEntry[];
  factors: SleepFactor[];
  onSave: (date: string, data: Omit<SleepEntry, "date">) => void;
  onCreateFactor: (factor: SleepFactor) => SleepFactor;
  onDeleteFactor: (factor: SleepFactor) => void;
};

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

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

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateString: string) {
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}.${month}.${year}`;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      iso: toLocalDateString(date),
      inMonth: date.getMonth() === month,
    };
  });
}

function factorKey(factor: SleepFactor) {
  return `${factor.emoji}::${factor.label}`;
}

export function NoteScreen({
  entries,
  factors,
  onSave,
  onCreateFactor,
  onDeleteFactor,
}: NoteScreenProps) {
  const today = useMemo(() => toLocalDateString(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(getMonthStart(new Date()));
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(7);
  const [selectedFactors, setSelectedFactors] = useState<SleepFactor[]>([]);
  const [emojiInput, setEmojiInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const entriesMap = useMemo(
    () => new Map(entries.map((entry) => [entry.date, entry])),
    [entries],
  );

  const selectedKeys = useMemo(
    () => new Set(selectedFactors.map((factor) => factorKey(factor))),
    [selectedFactors],
  );

  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);

  useEffect(() => {
    const entry = entriesMap.get(selectedDate);
    setHours(entry?.hours ?? 7);
    setQuality(entry?.quality ?? 7);
    setSelectedFactors(entry?.factors ?? []);
  }, [entriesMap, selectedDate]);

  useEffect(() => {
    const available = new Set(factors.map((factor) => factorKey(factor)));
    setSelectedFactors((prev) =>
      prev.filter((factor) => available.has(factorKey(factor))),
    );
  }, [factors]);

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

  function openCalendar() {
    const [year, month] = selectedDate.split("-").map(Number);
    if (year && month) {
      setCalendarMonth(new Date(year, month - 1, 1));
    }
    setIsCalendarOpen(true);
  }

  return (
    <section className="screen">
      <div className="note-header-row">
        <h1 className="title">Запись сна</h1>
        <button
          type="button"
          className="calendar-btn"
          aria-label="Выбрать дату"
          title="Выбрать дату"
          onClick={openCalendar}
        >
          📅
        </button>
      </div>

      <div className="card selected-date-card">{formatDateLabel(selectedDate)}</div>

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
        onClick={() => onSave(selectedDate, { hours, quality, factors: selectedFactors })}
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

      {isCalendarOpen && (
        <div className="modal-overlay" onClick={() => setIsCalendarOpen(false)}>
          <div className="modal calendar-modal" onClick={(event) => event.stopPropagation()}>
            <div className="calendar-head">
              <button
                type="button"
                className="week-arrow"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                  )
                }
              >
                ←
              </button>
              <strong>
                {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </strong>
              <button
                type="button"
                className="week-arrow"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                  )
                }
              >
                →
              </button>
            </div>

            <div className="calendar-weekdays">
              {WEEK_DAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((day) => {
                const isSelected = day.iso === selectedDate;
                const className = [
                  "calendar-day",
                  day.inMonth ? "" : "outside",
                  isSelected ? "selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={day.iso}
                    type="button"
                    className={className}
                    onClick={() => {
                      setSelectedDate(day.iso);
                      setIsCalendarOpen(false);
                    }}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
