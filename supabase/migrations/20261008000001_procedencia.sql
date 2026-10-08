-- ============================================================================
-- Procedência da matéria
--
-- O dono do veículo disse, duas vezes: "não quero plágio, apenas inspiração".
-- Esta migração é onde essa frase deixa de ser instrução de prompt e vira
-- invariante de banco. Um modelo esquece numa manhã ruim; uma check
-- constraint não esquece.
-- ============================================================================

alter table public.articles
  add column if not exists origem              text,
  add column if not exists fonte_original_url  text,
  add column if not exists fonte_original_nome text,
  add column if not exists precisa_checagem    boolean not null default false;

-- `origem is null` é o caminho manual: matéria escrita por uma pessoa.
-- Precisa continuar passando, senão quebramos o CMS inteiro.
alter table public.articles drop constraint if exists articles_origem_valida;
alter table public.articles
  add constraint articles_origem_valida
    check (origem is null or origem in ('release', 'primaria', 'derivada'));

-- O ponto que carrega a regra do dono.
alter table public.articles drop constraint if exists articles_derivada_tem_fonte;
alter table public.articles
  add constraint articles_derivada_tem_fonte
    check (origem <> 'derivada' or fonte_original_url is not null);

-- Endereço de origem precisa ser endereço. Sem isto, `javascript:...` vira
-- link clicável na página pública, porque o crédito é renderizado como <a>.
alter table public.articles drop constraint if exists articles_fonte_eh_http;
alter table public.articles
  add constraint articles_fonte_eh_http
    check (fonte_original_url is null
           or fonte_original_url ~* '^https?://[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}(:[0-9]+)?(/|$|\?|#)');

-- Estado de reserva da pauta. A coluna tem check desde o vigia, então o
-- valor novo precisa entrar nela.
alter table public.pautas drop constraint if exists pautas_estado_check;
alter table public.pautas
  add constraint pautas_estado_check
    check (estado in ('nova', 'em_producao', 'lida', 'descartada', 'virou_materia'));

-- Privilégio de coluna: o crédito é público, a marca de checagem não.
--
-- O revoke da TABELA vem primeiro. Privilégio de coluna é ignorado enquanto
-- o papel tem o da tabela inteira — isso já mordeu este repositório.
revoke select on public.articles from anon, authenticated;
grant select (
  id, slug, title, subtitle, excerpt, cover_url, category_id, author_id,
  status, is_premium, is_exclusive, reading_time, view_count, published_at,
  created_at, updated_at, standfirst, scheduled_for, seo_title,
  seo_description, updated_by,
  origem, fonte_original_url, fonte_original_nome
) on public.articles to anon, authenticated;

-- A marca é informação de redação: `authenticated` lê, `anon` não. Não é
-- afrouxamento — a marca bloqueia a publicação, então matéria publicada tem
-- sempre `false`, e não há o que vazar para leitor logado.
grant select (precisa_checagem) on public.articles to authenticated;
