interface PulseItem {
  label: string;
  score: number;
}

const PULSE_ITEMS: PulseItem[] = [
  { label: "Auto", score: 78 },
  { label: "Vida", score: 65 },
  { label: "Saúde", score: 42 },
  { label: "Agro", score: 55 },
  { label: "Resseguros", score: -28 },
  { label: "Regulação", score: -18 },
];

function scoreColor(score: number): string {
  if (score > 15) return "#12956A";
  if (score < -15) return "#B83232";
  return "#B87214";
}

export default function PulseStrip() {
  return (
    <section
      aria-label="Termômetro de sentimento do mercado"
      className="hidden border-b border-[rgba(0,0,0,.08)] bg-white py-2.5 md:block"
    >
      <div className="mx-auto flex max-w-[1240px] items-center gap-8 px-8">
        <ul className="flex flex-1 items-center gap-6">
          {PULSE_ITEMS.map((item) => {
            const color = scoreColor(item.score);
            const pct = Math.min(100, Math.abs(item.score));
            return (
              <li key={item.label} className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase text-[#76766f]">
                  {item.label}
                </span>
                <span className="h-1 w-11 overflow-hidden rounded-full bg-[#1A1A18]/10">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </span>
                <span
                  className="font-mono text-[12px] font-medium"
                  style={{ color }}
                >
                  {item.score > 0 ? `+${item.score}` : item.score}
                </span>
              </li>
            );
          })}
        </ul>
        <a
          href="/dashboard"
          className="shrink-0 font-mono text-[12px] font-medium text-[#0D6E4F] hover:underline"
        >
          Dashboard →
        </a>
      </div>
    </section>
  );
}
