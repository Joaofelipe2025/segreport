const TICKER_ITEMS = [
  { label: "SELIC", value: "10,75%", type: "neutral" },
  { label: "IPCA", value: "4,83%", type: "neutral" },
  { label: "Prêmios", value: "+11,4% ↑", type: "positive" },
  { label: "Sinistralidade", value: "+2,3pp", type: "negative" },
  { label: "USD/BRL", value: "R$5,18", type: "neutral" },
  { label: "Circ. SUSEP", value: "722", type: "neutral" },
  { label: "IRB Brasil", value: "+R$180M", type: "positive" },
  { label: "Seguro agro", value: "+22%", type: "positive" },
];

const VALUE_COLOR: Record<string, string> = {
  positive: "#4ADE80",
  negative: "#F87171",
  neutral: "rgba(255,255,255,.5)",
};

const ALL_ITEMS = [...TICKER_ITEMS, ...TICKER_ITEMS];

export default function Ticker() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: "var(--ink)",
        height: 30,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          color: "var(--green-2)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          padding: "0 14px",
          flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,.06)",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        MERCADO
      </span>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <div className="animate-ticker" style={{ display: "flex", width: "max-content" }}>
          {ALL_ITEMS.map((item, i) => (
            <span
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 20px",
                borderRight: "1px solid rgba(255,255,255,.05)",
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: "rgba(255,255,255,.45)" }}>{item.label}</span>
              <span style={{ color: VALUE_COLOR[item.type] }}>{item.value}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
