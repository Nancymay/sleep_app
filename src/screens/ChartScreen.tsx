import { useMemo, useState } from "react";
import type { SleepEntry } from "../types/sleep";

type ChartScreenProps = {
  entries: SleepEntry[];
  animationSeed: number;
};

type ChartMetricTab = "sleep" | "quality";

type ChartPoint = {
  x: number;
  y: number;
  entry: SleepEntry;
};

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(baseDate: Date) {
  const date = new Date(baseDate);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDates(weekOffset: number) {
  const start = getWeekStart(new Date());
  start.setDate(start.getDate() + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toLocalDateString(date);
  });
}

function formatDay(dateString: string) {
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}.${month}`;
}

function formatWeekRange(dates: string[]) {
  if (dates.length === 0) return "";
  return `${formatDay(dates[0])} - ${formatDay(dates[dates.length - 1])}`;
}

export function ChartScreen({ entries, animationSeed }: ChartScreenProps) {
  const [selectedEntry, setSelectedEntry] = useState<SleepEntry | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [metricTab, setMetricTab] = useState<ChartMetricTab>("sleep");
  const dates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const entryMap = useMemo(
    () => new Map(entries.map((entry) => [entry.date, entry])),
    [entries],
  );
  const isQualityTab = metricTab === "quality";

  const recentEntries = useMemo(
    () => dates.map((date) => entryMap.get(date)).filter((entry): entry is SleepEntry => Boolean(entry)),
    [dates, entryMap],
  );

  const bestDays = useMemo(() => {
    if (isQualityTab) {
      return [...recentEntries]
        .filter((entry) => entry.quality > 5)
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return [...recentEntries]
      .filter((entry) => entry.hours > 6)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [recentEntries, isQualityTab]);

  const worstDays = useMemo(() => {
    if (isQualityTab) {
      return [...recentEntries]
        .filter((entry) => entry.quality <= 5)
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return [...recentEntries]
      .filter((entry) => entry.hours <= 6)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [recentEntries, isQualityTab]);

  const chart = useMemo(() => {
    const axisWidth = 34;
    const width = 340;
    const height = 272;
    const paddingX = 10;
    const paddingY = 26;
    const stepX = (width - paddingX * 2) / (dates.length - 1);

    const maxFromData = recentEntries.length > 0 ? Math.max(...recentEntries.map((entry) => entry.hours)) : 8;
    const yMax = isQualityTab ? 10 : Math.max(10, Math.ceil((maxFromData + 1) / 2) * 2);
    const yMin = isQualityTab ? 1 : 0;

    const valueToY = (value: number) =>
      height - paddingY - ((value - yMin) / (yMax - yMin || 1)) * (height - paddingY * 2);

    const tickValues = isQualityTab
      ? Array.from({ length: 10 }, (_, index) => 10 - index)
      : Array.from({ length: 5 }, (_, index) => yMax - (index * (yMax - yMin)) / 4);

    const ticks = tickValues.map((value) => ({ value, y: valueToY(value) }));

    const points: ChartPoint[] = dates
      .map((date, index) => {
        const entry = entryMap.get(date);
        if (!entry) return null;

        const metricValue = isQualityTab ? entry.quality : entry.hours;
        const y = valueToY(metricValue);

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
  }, [dates, entryMap, recentEntries, isQualityTab]);

  return (
    <section className="screen">
      <h1 className="title">График сна</h1>
      <div className="week-switcher">
        <button
          type="button"
          className="week-arrow"
          aria-label="Предыдущая неделя"
          onClick={() => setWeekOffset((prev) => prev - 1)}
        >
          ←
        </button>
        <input
          className="week-range-input"
          value={formatWeekRange(dates)}
          readOnly
          aria-label="Диапазон недели"
        />
        <button
          type="button"
          className="week-arrow"
          aria-label="Следующая неделя"
          onClick={() => setWeekOffset((prev) => prev + 1)}
        >
          →
        </button>
      </div>
      <div className="chart-metric-tabs">
        <button
          type="button"
          className={metricTab === "sleep" ? "metric-tab active" : "metric-tab"}
          onClick={() => setMetricTab("sleep")}
        >
          Сон
        </button>
        <button
          type="button"
          className={metricTab === "quality" ? "metric-tab active" : "metric-tab"}
          onClick={() => setMetricTab("quality")}
        >
          Качество сна
        </button>
      </div>

      <div className="card chart-card">
        <div className="chart-wrap">
          <div className="y-axis" style={{ width: chart.axisWidth, height: chart.height }}>
            {chart.ticks.map((tick) => (
              <span key={tick.value} style={{ top: tick.y }} className="y-axis-label">
                {isQualityTab ? tick.value.toFixed(0) : `${tick.value.toFixed(0)}ч`}
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
              aria-label={isQualityTab ? "График качества сна" : "График часов сна"}
            >
              {chart.points.length > 1 && (
                <polyline
                  key={`${animationSeed}-${metricTab}-${chart.polyline}`}
                  className="chart-line"
                  pathLength={1}
                  points={chart.polyline}
                />
              )}

              {chart.points.map((point) => (
                <g key={point.entry.date} onClick={() => setSelectedEntry(point.entry)}>
                  <circle
                    className="chart-hit-area"
                    cx={point.x}
                    cy={point.y}
                    r="20"
                  />
                  {point.entry.factors[0]?.emoji ? (
                    <text x={point.x} y={point.y - 20} textAnchor="middle" className="point-emoji">
                      {point.entry.factors[0].emoji}
                    </text>
                  ) : null}
                  <circle
                    className="chart-point"
                    cx={point.x}
                    cy={point.y}
                    r="12"
                  />
                  <text x={point.x} y={point.y + 4} textAnchor="middle" className="point-quality">
                    {isQualityTab ? point.entry.hours.toFixed(1).replace(".0", "") : point.entry.quality}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div
          className="chart-labels-wrap"
          style={{ marginLeft: chart.axisWidth, width: chart.width - 20 }}
        >
          <div
            className="chart-labels"
            style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}
          >
            {dates.map((date) => (
              <span key={date} className="x-label">
                {formatDay(date)}
              </span>
            ))}
          </div>
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
