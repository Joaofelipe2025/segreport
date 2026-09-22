import type { FlashPost, MarketEvent } from "@/lib/types";
import { photo } from "./media";

/** Flash do Mercado — cobertura fotográfica de eventos do setor. */
export const FLASH_POSTS: FlashPost[] = [
  {
    slug: "almoco-clube-corretores",
    title: "Almoço do Clube dos Corretores",
    venue: "São Paulo · SP",
    date: "2026-09-18",
    photoCount: 12,
    cover: photo("flash-almoco", 700, 500),
  },
  {
    slug: "premio-melhores-do-seguro",
    title: "Prêmio Melhores do Seguro 2026",
    venue: "São Paulo · SP",
    date: "2026-09-11",
    photoCount: 48,
    cover: photo("flash-premio", 700, 500),
  },
  {
    slug: "cqcs-insurtech-innovation",
    title: "CQCS Insurtech & Innovation",
    venue: "Rio de Janeiro · RJ",
    date: "2026-09-04",
    photoCount: 36,
    cover: photo("flash-insurtech", 700, 500),
  },
  {
    slug: "congresso-nacional-seguros",
    title: "Congresso Nacional de Seguros",
    venue: "Brasília · DF",
    date: "2026-08-27",
    photoCount: 54,
    cover: photo("flash-congresso", 700, 500),
  },
  {
    slug: "encontro-resseguradores",
    title: "Encontro de Resseguradores",
    venue: "São Paulo · SP",
    date: "2026-08-19",
    photoCount: 27,
    cover: photo("flash-resseguro", 700, 500),
  },
  {
    slug: "forum-saude-suplementar",
    title: "Fórum de Saúde Suplementar",
    venue: "Belo Horizonte · MG",
    date: "2026-08-08",
    photoCount: 41,
    cover: photo("flash-saude", 700, 500),
  },
];

/** Agenda do setor. */
export const EVENTS: MarketEvent[] = [
  {
    id: "webinar-open-insurance",
    title: "Webinar: Open Insurance na Prática",
    summary:
      "Entenda como as novas fases do Open Insurance impactam o seu negócio.",
    kind: "webinar",
    date: "2026-10-15",
    time: "14h00",
    location: "Online",
  },
  {
    id: "conferencia-insurtech-brasil",
    title: "Conferência Insurtech Brasil",
    summary:
      "Dois dias de painéis sobre precificação, automação de sinistro e distribuição digital.",
    kind: "conference",
    date: "2026-10-22",
    time: "09h00",
    location: "São Paulo · SP",
  },
  {
    id: "premio-excelencia-corretagem",
    title: "Prêmio Excelência em Corretagem",
    summary:
      "Premiação anual das corretoras com melhor índice de satisfação de clientes.",
    kind: "award",
    date: "2026-11-06",
    time: "19h30",
    location: "São Paulo · SP",
  },
  {
    id: "meetup-atuarios",
    title: "Meetup de Atuários e Cientistas de Dados",
    summary:
      "Encontro técnico sobre modelos de precificação e validação de série histórica.",
    kind: "meetup",
    date: "2026-11-19",
    time: "19h00",
    location: "Rio de Janeiro · RJ",
  },
  {
    id: "congresso-saude-suplementar",
    title: "Congresso Brasileiro de Saúde Suplementar",
    summary:
      "Reajuste, rede credenciada e o futuro da regulação da ANS em debate.",
    kind: "conference",
    date: "2026-12-03",
    time: "08h30",
    location: "Brasília · DF",
  },
  {
    id: "webinar-seguro-agricola",
    title: "Webinar: Paramétricos no Seguro Agrícola",
    summary:
      "Como estruturar gatilho climático e lidar com risco de base em contratos rurais.",
    kind: "webinar",
    date: "2026-12-10",
    time: "15h00",
    location: "Online",
  },
];

export const EVENT_KIND_LABELS: Record<MarketEvent["kind"], string> = {
  conference: "Conference",
  webinar: "Webinar",
  award: "Award",
  meetup: "Meetup",
};
