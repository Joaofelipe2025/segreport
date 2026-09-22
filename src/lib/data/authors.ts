import type { Author } from "@/lib/types";
import { avatar } from "./media";

export const AUTHORS: Author[] = [
  {
    slug: "redacao",
    name: "Redação SegReport",
    role: "Equipe editorial",
    bio: "Cobertura diária do mercado segurador brasileiro.",
    avatar: avatar("redacao"),
    columnist: false,
  },
  {
    slug: "helena-braga",
    name: "Helena Braga",
    role: "Colunista · Regulação",
    bio: "Advogada especializada em direito securitário, acompanha SUSEP e CNSP há 18 anos. Escreve sobre o impacto prático da norma no balanço das seguradoras.",
    avatar: avatar("helena-braga"),
    columnist: true,
  },
  {
    slug: "rodrigo-teixeira",
    name: "Rodrigo Teixeira",
    role: "Colunista · Tecnologia",
    bio: "Atuário e fundador de insurtech. Analisa como modelo de precificação e automação mudam a operação de subscrição.",
    avatar: avatar("rodrigo-teixeira"),
    columnist: true,
  },
  {
    slug: "carla-mendonca",
    name: "Carla Mendonça",
    role: "Colunista · Saúde",
    bio: "Economista da saúde. Cobre operadoras, ANS, reajuste de coletivos e a economia da rede credenciada.",
    avatar: avatar("carla-mendonca"),
    columnist: true,
  },
  {
    slug: "paulo-rivera",
    name: "Paulo Rivera",
    role: "Colunista · Resseguros",
    bio: "Trabalhou 12 anos em resseguradora internacional. Escreve sobre capacidade, retrocessão e ciclos de mercado.",
    avatar: avatar("paulo-rivera"),
    columnist: true,
  },
  {
    slug: "juliana-sato",
    name: "Juliana Sato",
    role: "Colunista · Agronegócio",
    bio: "Engenheira agrônoma e subscritora de risco rural. Cobre seguro paramétrico e gestão de risco climático.",
    avatar: avatar("juliana-sato"),
    columnist: true,
  },
  {
    slug: "marcos-vilela",
    name: "Marcos Vilela",
    role: "Colunista · Mercado",
    bio: "Ex-executivo de distribuição. Acompanha fusões, aquisições e a consolidação da corretagem no Brasil.",
    avatar: avatar("marcos-vilela"),
    columnist: true,
  },
  {
    slug: "tatiana-alencar",
    name: "Tatiana Alencar",
    role: "Colunista · Cyber",
    bio: "Especialista em risco cibernético. Escreve sobre subscrição de cyber, LGPD e resposta a incidente.",
    avatar: avatar("tatiana-alencar"),
    columnist: true,
  },
];

const BY_SLUG = new Map(AUTHORS.map((a) => [a.slug, a]));

export function findAuthor(slug: string): Author | undefined {
  return BY_SLUG.get(slug);
}
