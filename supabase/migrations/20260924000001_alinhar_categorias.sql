-- ============================================================================
-- Alinhar as categorias do banco com a taxonomia do portal
--
-- As categorias vieram da migração de junho, anterior ao desenho editorial
-- atual. Duas divergiam no nome e quatro do menu não existiam — os links
-- /mercado, /politica, /cyber e /beneficios levavam a páginas vazias, e as
-- categorias `agro` e `tech` do banco não correspondiam a link nenhum.
--
-- A chave é o que o portal usa na URL, então renomear é o que reconecta as
-- duas pontas. Usa update, não delete mais insert: matéria já publicada
-- aponta para o id, e apagar a categoria a deixaria órfã.
-- ============================================================================

update public.categories set key = 'agronegocio', slug = 'agronegocio', label = 'Agronegócio'
 where key = 'agro';

update public.categories set key = 'tecnologia', slug = 'tecnologia', label = 'Tecnologia'
 where key = 'tech';

-- As quatro que faltavam. `on conflict do nothing` deixa a migração ser
-- reaplicada sem erro num banco que já as tenha.
insert into public.categories (key, label, color, emoji, slug) values
  ('mercado',    'Mercado',    '#0D6E4F', '📈', 'mercado'),
  ('politica',   'Política',   '#B87214', '🏛️', 'politica'),
  ('cyber',      'Cyber',      '#1A6FB0', '🔐', 'cyber'),
  ('beneficios', 'Benefícios', '#12956A', '🧾', 'beneficios')
on conflict (key) do nothing;
