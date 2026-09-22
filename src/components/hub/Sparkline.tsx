/**
 * Micrográfico de tendência para dentro do cartão de indicador.
 *
 * Um número grande sozinho não diz nada: "+6,2%" pode ser recuperação ou
 * desaceleração dependendo de onde estava. A sparkline dá essa leitura sem
 * ocupar espaço nem exigir clique.
 *
 * SVG desenhado no servidor, sem biblioteca nem JavaScript no cliente.
 */
export default function Sparkline({
  values,
  tone = "lime",
  className = "",
}: {
  values: number[];
  tone?: "lime" | "muted";
  className?: string;
}) {
  if (values.length < 2) return null;

  const width = 100;
  const height = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  // Margem vertical para a linha não encostar nas bordas do desenho.
  const pad = 3;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  // Mesma linha fechada até a base, para o preenchimento sob a curva.
  const area = `${line} L${width},${height} L0,${height} Z`;

  const stroke = tone === "lime" ? "var(--color-lime-400)" : "var(--color-forest-500)";

  // Identificador único por instância: um `id` fixo se repetiria em cada
  // cartão da grade, e id duplicado no DOM é HTML inválido — o navegador
  // resolve pelo primeiro elemento, então remover um cartão apagaria o
  // preenchimento de todos os outros. Derivado dos próprios valores para o
  // servidor e o cliente chegarem ao mesmo resultado.
  const gradientId = `spark-${tone}-${hashValues(values)}`;

  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`h-7 w-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="2" fill={stroke} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Impressão digital curta e determinística de uma série. */
function hashValues(values: number[]): string {
  let hash = 2166136261;
  for (const value of values) {
    hash ^= Math.round(value * 10);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
