import { useMemo, useState } from "react";
import type { SleepEntry } from "../types/sleep";

type ChartScreenProps = {
  entries: SleepEntry[];
};

type ChartPoint = {
  x: number;
  y: number;
  entry: SleepEntry;
};

function getLastNDates(days: number) {
  const result: string[] = [];
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    result.push(date.toISOString().slice(0, 10));
  }

  return result;
}

function formatDay(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function seededNumber(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createMockEntry(date: string): SleepEntry {
  const seed = seededNumber(date);
  const hours = 5 + (seed % 11) * 0.5;
  const quality = Math.max(1, Math.min(10, Math.round((hours / 10) * 10)));
  const factorPool = [
    { emoji: "📱", label: "Поздний экран" },
    { emoji: "☕", label: "Кофе" },
    { emoji: "🚶", label: "Прогулка" },
    { emoji: "🧘", label: "Йога" },
    { emoji: "🌧️", label: "Погода" },
  ];
  const factorCount = 1 + (seed % 2);
  const factors = Array.from({ length: factorCount }, (_, index) => {
    return factorPool[(seed + index) % factorPool.length];
  });

  return { date, hours, quality, factors };
}

export function ChartScreen({ entries }: ChartScreenProps) {
  const [selectedEntry, setSelectedEntry] = useState<SleepEntry | null>(null);
  const dates = useMemo(() => getLastNDates(14), []);
  const weekDates = useMemo(() => getWeekDates(), []);

  const entryMap = useMemo(() => {
    const realEntriesMap = new Map(entries.map((entry) => [entry.date, entry]));
    const today = new Date().toISOString().slice(0, 10);

    weekDates.forEach((date) => {
      const isPastOrToday = date <= today;
      const isVisibleInChart = dates.includes(date);
      if (!realEntriesMap.has(date) && isPastOrToday && isVisibleInChart) {
        realEntriesMap.set(date, createMockEntry(date));
      }
    });

    return realEntriesMap;
  }, [entries, weekDates, dates]);

  const recentEntries = useMemo(
    () => dates.map((date) => entryMap.get(date)).filter((entry): entry is SleepEntry => Boolean(entry)),
    [dates, entryMap],
  );

  const bestDays = useMemo(() => {
    return [...recentEntries]
      .sort((a, b) => b.quality - a.quality || b.hours - a.hours)
      .slice(0, 3);
  }, [recentEntries]);

  const worstDays = useMemo(() => {
    return [...recentEntries]
      .sort((a, b) => a.quality - b.quality || a.hours - b.hours)
      .slice(0, 3);
  }, [recentEntries]);

  const chart = useMemo(() => {
    const axisWidth = 34;
    const width = 340;
    const height = 220;
    const paddingX = 10;
    const paddingY = 12;
    const stepX = (width - paddingX * 2) / (dates.length - 1);

    const maxFromData = recentEntries.length > 0 ? Math.max(...recentEntries.map((entry) => entry.hours)) : 8;
    const yMax = Math.max(8, Math.ceil(maxFromData / 2) * 2);
    const yMin = 0;

    const ticks = Array.from({ length: 5 }, (_, index) => {
      const value = yMax - (index * (yMax - yMin)) / 4;
      const y = paddingY + (index * (height - paddingY * 2)) / 4;
      return { value, y };
    });

    const points: ChartPoint[] = dates
      .map((date, index) => {
        const entry = entryMap.get(date);
        if (!entry) return null;

        const normalized = (entry.hours - yMin) / (yMax - yMin || 1);
        const y = height - paddingY - normalized * (height - paddingY * 2);

        return {
          entry,
          x: paddingX + stepX * index,
          y,
        };
      })
      .filter((item): item is ChartPoint => Boolean(item));

    return {
      axisWidth,
      width,
      height,
      ticks,
      points,
      polyline: points.map((point) => `${point.x},${point.y}`).join(" "),
    };
  }, [dates, entryMap, recentEntries]);

  return (
    <section className="screen">
      <h1 className="title">График сна</h1>

      <div className="card chart-card">
        <div className="chart-wrap">
          <div className="y-axis" style={{ width: chart.axisWidth, height: chart.height }}>
            {chart.ticks.map((tick) => (
              <span key={tick.value} style={{ top: tick.y }} className="y-axis-label">
                {tick.value.toFixed(0)}ч
              </span>
            ))}
          </div>

          <div className="chart-grid" style={{ width: chart.width, height: chart.height }}>
            {chart.ticks.map((tick) => (
              <div key={tick.value} className="grid-line" style={{ top: tick.y }} />
            ))}

            <svg
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              className="chart-svg"
              aria-label="График часов сна"
            >
              {chart.points.length > 1 && (
                <polyline
                  key={chart.polyline}
                  className="chart-line"
                  points={chart.polyline}
                />
              )}

              {chart.points.map((point) => (
                <g key={point.entry.date}>
                  {point.entry.factors[0]?.emoji ? (
                    <text x={point.x} y={point.y - 16} textAnchor="middle" className="point-emoji">
                      {point.entry.factors[0].emoji}
                    </text>
                  ) : null}
                  <circle
                    className="chart-point"
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    onClick={() => setSelectedEntry(point.entry)}
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="chart-labels">
          {dates.map((date, index) => (
            <span key={date} className={index % 2 === 0 ? "x-label" : "x-label muted"}>
              {index % 2 === 0 ? formatDay(date) : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="card summary-card">
        <p className="label">Лучшие дни</p>
        {bestDays.length > 0 ? (
          <div className="summary-list">
            {bestDays.map((entry) => (
              <div key={`best-${entry.date}`} className="summary-row">
                <span className="summary-date">{formatDay(entry.date)}</span>
                <span className="summary-factors">
                  {entry.factors.length > 0
                    ? entry.factors.map((factor) => `${factor.emoji} ${factor.label}`).join(" · ")
                    : "Нет факторов"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="muted-text">Пока нет данных</span>
        )}
      </div>

      <div className="card summary-card">
        <p className="label">Худшие дни</p>
        {worstDays.length > 0 ? (
          <div className="summary-list">
            {worstDays.map((entry) => (
              <div key={`worst-${entry.date}`} className="summary-row">
                <span className="summary-date">{formatDay(entry.date)}</span>
                <span className="summary-factors">
                  {entry.factors.length > 0
                    ? entry.factors.map((factor) => `${factor.emoji} ${factor.label}`).join(" · ")
                    : "Нет факторов"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="muted-text">Пока нет данных</span>
        )}
      </div>

      {selectedEntry && (
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>{formatDay(selectedEntry.date)}</h2>
            <p>Часы: {selectedEntry.hours.toFixed(1)}</p>
            <p>Качество: {selectedEntry.quality}/10</p>
            <p>Факторы:</p>
            <div className="modal-factors">
              {selectedEntry.factors.length > 0 ? (
                selectedEntry.factors.map((factor) => (
                  <span key={`${factor.emoji}-${factor.label}`} className="modal-chip">
                    {factor.emoji} {factor.label}
                  </span>
                ))
              ) : (
                <span className="muted-text">Нет факторов</span>
              )}
            </div>
            <button className="close-btn" onClick={() => setSelectedEntry(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
