# Arquivos de marca — SegReport

Originais do Illustrator, guardados como referência. **Não são servidos ao
navegador**: o portal usa `src/components/ui/Logo.tsx` (SVG inline) e as
versões limpas em `public/logo/`.

Os originais trazem cerca de 7 KB de sobras de prancheta fora do `viewBox`
— retângulos e cópias em coordenadas negativas, invisíveis mas baixadas.

## Qual variante usar

| Arquivo | "seg" | "report" | Onde usar |
|---|---|---|---|
| `segreport_logobgdark.svg` | `#C7F14B` | `#FFFCFE` | Fundos escuros: header, rodapé, 404, Hub |
| `segreport_logo-dark.svg` | `#192F1F` | `#192F1F` | Fundos claros — variante legível |
| `segreport_logobglight.svg` | `#C7F14B` | `#192F1F` | Peça grande sobre claro, uso deliberado |

## Contraste

O lima `#C7F14B` tem luminância relativa de 0,755. Sobre branco isso dá
**1,30:1**, e sobre o papel do portal (`#F7F8F5`), **1,25:1**.

A WCAG isenta logotipos de exigência de contraste, mas a isenção é jurídica,
não óptica: em navegação o "seg" em lima sobre fundo claro desaparece. Por
isso a variante `brand-light` existe no componente mas não é o padrão em
nenhuma superfície clara.

Em fundo escuro o lima tem contraste de aproximadamente **12:1** — é ali que
a marca funciona como foi desenhada.
