import zlib from "node:zlib";

/**
 * Gerador de imagens do preview.
 *
 * O portal usava o picsum.photos, que responde com redirecionamento e leva
 * cerca de 1,7s por imagem. Com trinta imagens numa home, o otimizador do
 * Next estoura o tempo limite e a página inteira cai na tela de erro.
 *
 * Aqui as imagens são desenhadas em memória e codificadas em PNG sem nenhuma
 * dependência externa: não há rede no caminho, o resultado é determinístico
 * por semente e o mesmo slug devolve sempre a mesma imagem.
 *
 * São marcadores de posição — servem para avaliar enquadramento, proporção,
 * contraste do texto sobre a imagem e hierarquia. As fotos reais entram pelo
 * upload do CMS.
 */

// ---------------------------------------------------------------- PNG

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let c = -1;
  for (let i = 0; i < buffer.length; i++) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([length, typeAndData, crc]);
}

/** Codifica pixels RGB (3 bytes por pixel) num PNG de 8 bits sem paleta. */
function encodePng(width: number, height: number, rgb: Buffer): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profundidade de bits
  ihdr[9] = 2; // cor verdadeira (RGB)
  ihdr[10] = 0; // compressão deflate
  ihdr[11] = 0; // filtro adaptativo
  ihdr[12] = 0; // sem entrelaçamento

  // Cada linha do PNG começa com um byte de filtro; 0 significa "sem filtro".
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const idat = zlib.deflateSync(raw, { level: 6 });

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- desenho

/** Gerador pseudoaleatório determinístico a partir de uma semente textual. */
function seededRandom(seed: string) {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

/**
 * Paletas de fundo.
 *
 * Tons dessaturados e escuros o bastante para o texto branco sobreposto
 * manter contraste — é isso que as manchetes da home exigem. Nada de cor
 * saturada, que competiria com o lima da marca.
 */
const PALETTES: Array<[number, number, number][]> = [
  [[26, 48, 36], [58, 92, 70], [128, 156, 132]], // verde profundo
  [[30, 42, 56], [62, 84, 108], [138, 158, 178]], // azul ardósia
  [[52, 44, 36], [96, 80, 64], [168, 148, 124]], // terroso quente
  [[40, 36, 52], [78, 70, 100], [150, 140, 176]], // ameixa
  [[24, 46, 48], [56, 92, 94], [132, 168, 166]], // petróleo
  [[48, 38, 40], [92, 72, 74], [164, 136, 138]], // vinho acinzentado
];

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Compõe a imagem: gradiente diagonal entre três paradas de cor, foco de luz
 * radial deslocado e ondulação suave que quebra a chapa do gradiente.
 *
 * Tudo aqui é de BAIXA FREQUÊNCIA de propósito. A primeira versão usava grão
 * por pixel, que parecia melhor mas era ruído puro: o deflate não comprime
 * ruído, e a imagem saía com 2,4 MB em 6 segundos — pior que o serviço
 * externo que ela veio substituir. Variação em escala grande comprime bem e
 * mantém a imagem com relevo.
 */
export function renderPreviewPng(
  seed: string,
  width: number,
  height: number
): Buffer {
  const random = seededRandom(seed);

  const palette = PALETTES[Math.floor(random() * PALETTES.length)];
  const angle = random() * Math.PI * 2;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  // Centro do foco de luz, mantido dentro da área central da imagem.
  const lightX = (0.25 + random() * 0.5) * width;
  const lightY = (0.2 + random() * 0.45) * height;
  const lightRadius = (0.45 + random() * 0.35) * Math.max(width, height);

  const rgb = Buffer.alloc(width * height * 3);
  const diagonal = Math.abs(dirX) * width + Math.abs(dirY) * height;

  // Duas ondulações de período longo, com fase e frequência sorteadas.
  const waveFreqA = (2 + random() * 3) * Math.PI;
  const waveFreqB = (3 + random() * 4) * Math.PI;
  const wavePhase = random() * Math.PI * 2;
  const lightRadiusSq = lightRadius * lightRadius;

  for (let y = 0; y < height; y++) {
    const ny = y / height;

    for (let x = 0; x < width; x++) {
      const nx = x / width;

      // Posição projetada no eixo do gradiente, normalizada para 0..1.
      const t = Math.min(Math.max((x * dirX + y * dirY) / diagonal + 0.5, 0), 1);

      const base =
        t < 0.5
          ? mix(palette[0], palette[1], t * 2)
          : mix(palette[1], palette[2], (t - 0.5) * 2);

      // Luz radial: clareia o foco e escurece as bordas. Comparação ao
      // quadrado evita a raiz quadrada em cada um dos pixels.
      const dx = x - lightX;
      const dy = y - lightY;
      const distanceSq = (dx * dx + dy * dy) / lightRadiusSq;
      const light = distanceSq < 1 ? (1 - distanceSq) * 40 : 0;
      const vignette = -Math.min(distanceSq * 10, 24);

      // Relevo de escala grande — dá volume sem virar ruído.
      const wave =
        Math.sin(nx * waveFreqA + wavePhase) * 7 +
        Math.sin((nx + ny) * waveFreqB) * 5;

      const shift = light + vignette + wave;
      const index = (y * width + x) * 3;
      rgb[index] = clampByte(base[0] + shift);
      rgb[index + 1] = clampByte(base[1] + shift);
      rgb[index + 2] = clampByte(base[2] + shift);
    }
  }

  return encodePng(width, height, rgb);
}

function clampByte(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : Math.round(value);
}
