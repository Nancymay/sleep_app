export type SleepFactor = {
  emoji: string;
  label: string;
};

export type SleepEntry = {
  date: string;
  hours: number;
  quality: number;
  factors: SleepFactor[];
};

export type SleepTab = "note" | "chart";
