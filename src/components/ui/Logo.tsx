/**
 * Logotipo SegReport.
 *
 * Desenhado em SVG inline em vez de <img src="logo.svg">: sem requisição
 * extra, nítido em qualquer densidade de tela, e as cores respondem às
 * variantes sem precisar de um arquivo por combinação.
 *
 * O traçado veio dos arquivos de marca do Illustrator. Os grupos estão
 * separados porque a marca colore "seg" e "report" de formas diferentes
 * conforme a superfície.
 *
 * CONTRASTE — o lima #C7F14B tem 1,30:1 sobre branco e 1,25:1 sobre o papel
 * do portal. Logotipo é isento de exigência de contraste na WCAG, mas a
 * isenção não o torna legível: em fundo claro o "seg" praticamente some.
 * Por isso a variante `light` usa verde-escuro nas duas palavras, e a
 * variante `brand-light` (lima sobre claro, como no arquivo original) fica
 * disponível para uso deliberado em peça grande, nunca em navegação.
 */

type LogoVariant = "dark" | "light" | "brand-light";

const PALETTE: Record<LogoVariant, { seg: string; report: string }> = {
  // Fundo escuro — combinação do arquivo `segreport_logobgdark.svg`
  dark: { seg: "#C7F14B", report: "#FFFCFE" },
  // Fundo claro, legível — arquivo `segreport_logo dark.svg`
  light: { seg: "#192F1F", report: "#192F1F" },
  // Fundo claro, marca cheia — `segreport_logobglight.svg`.
  // O "seg" fica com 1,25:1 sobre o papel: só para peça grande.
  "brand-light": { seg: "#C7F14B", report: "#192F1F" },
};

/** Recorte justo ao traçado: o arquivo original traz folga assimétrica. */
const VIEW_BOX = "8 18 372 66";

const SEG_PATHS = [
  "M45.262,51.473c0,6.927-7.003,11.799-17.737,11.799c-8.755,0-13.779-2.284-18.194-7.384v-9.135h0.152c5.101,6.699,10.125,9.896,17.661,9.896c5.938,0,10.353-1.751,10.353-5.938c0-10.429-26.796-0.837-26.796-18.499c0-8.145,6.166-12.332,16.443-12.332c8.145,0,12.332,2.207,16.748,7.384l-0.076,9.059H43.74c-5.177-6.699-8.678-9.896-16.215-9.896c-5.253,0-9.059,1.979-9.059,5.557C18.467,42.186,45.262,32.67,45.262,51.473z",
  "M90.027,42.947H56.684c0.456,9.516,6.014,13.855,13.017,13.855c7.612,0,12.941-3.197,18.042-9.896h0.152v9.135c-4.415,5.177-9.439,7.384-18.194,7.384c-11.419,0-21.011-7.155-21.011-21.848c0-14.844,9.972-21.772,20.935-21.772c10.658,0,19.64,6.394,20.402,18.803V42.947z M82.186,36.705c-1.523-7.384-5.862-10.581-12.256-10.581c-7.612,0-11.495,4.796-12.789,10.581H82.186z",
  "M139.36,76.214v6.319H99.165c-2.284,0-4.187-1.827-4.187-4.111c0-1.37,0.685-2.664,1.751-3.426l17.357-12.18c-10.277,0.99-20.859-6.09-20.859-21.087v-0.076c0-13.246,9.059-21.62,22.076-21.62h23.371v6.319h-9.592c4.492,3.045,7.384,8.145,7.384,15.301c0,9.668-4.263,15.301-11.495,20.706l-19.564,13.855H139.36z M100.992,41.729c0,9.972,6.471,16.671,13.855,16.671c10.049,0,14.236-7.384,14.236-16.671l5.557-0.076h-5.557c0-9.973-6.319-14.997-13.931-15.073c-7.689-0.076-14.16,5.024-14.16,15.073V41.729z",
];

const REPORT_PATHS = [
  "M171.528,19.997v6.318h-9.973c-5.252,0-7.079,1.523-7.079,7.385v27.938h-7.385V33.7c0.229-8.907,4.035-13.703,12.941-13.703H171.528z",
  "M213.094,42.225h-33.343c0.456,9.516,6.014,13.855,13.017,13.855c7.612,0,12.941-3.197,18.042-9.896h0.152v9.135c-4.415,5.177-9.439,7.384-18.194,7.384c-11.419,0-21.011-7.156-21.011-21.848c0-14.844,9.972-21.772,20.935-21.772c10.658,0,19.64,6.394,20.402,18.803V42.225z M205.253,35.983c-1.523-7.384-5.862-10.581-12.256-10.581c-7.612,0-11.495,4.796-12.789,10.581H205.253z",
  "M260.372,40.703c0,14.464-9.592,21.696-20.174,21.696c-6.318,0-12.028-2.512-15.682-7.536V78.69h-7.384V40.703c0-14.311,10.048-21.619,21.315-21.619C249.942,19.083,260.372,26.239,260.372,40.703z M238.447,25.63c-7.536,0.076-13.931,5.1-13.931,15.073c0,10.125,6.699,15.073,14.236,15.073c7.46,0,13.855-5.101,13.855-15.073C252.607,30.578,246.136,25.554,238.447,25.63z",
  "M307.193,40.855c0,13.094-8.298,21.772-21.848,21.772c-13.474,0-21.772-8.678-21.772-21.772c0-13.17,8.297-21.848,21.772-21.848C298.895,19.007,307.193,27.685,307.193,40.855z M299.428,40.855c0-9.668-5.329-14.997-14.083-14.997c-8.678,0-14.007,5.329-14.007,14.997c0,9.592,5.329,14.997,14.007,14.997C294.099,55.852,299.428,50.447,299.428,40.855z",
  "M336.048,19.997v6.318h-9.973c-5.253,0-7.08,1.523-7.08,7.385v27.938h-7.384V33.7c0.229-8.907,4.035-13.703,12.941-13.703H336.048z",
  "M341.822,20.086v6.213h11.052c1.951,0,3.523,1.62,3.523,3.608v31.292h7.046v-34.9h14.651v-6.213H341.822z",
];

export default function Logo({
  variant = "dark",
  className = "h-7",
  title = "SegReport",
}: {
  variant?: LogoVariant;
  /** Controle a altura por classe; a largura acompanha a proporção 5,6:1. */
  className?: string;
  /** Texto alternativo. Passe string vazia quando houver rótulo ao lado. */
  title?: string;
}) {
  const colors = PALETTE[variant];
  const labelled = title.length > 0;

  return (
    <svg
      viewBox={VIEW_BOX}
      className={`w-auto ${className}`}
      role={labelled ? "img" : "presentation"}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      <g fill={colors.seg}>
        {SEG_PATHS.map((d) => (
          <path key={d.slice(0, 18)} d={d} />
        ))}
      </g>
      <g fill={colors.report}>
        {REPORT_PATHS.map((d) => (
          <path key={d.slice(0, 18)} d={d} />
        ))}
      </g>
    </svg>
  );
}
