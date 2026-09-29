-- ============================================================================
-- Endurecimento OPCIONAL: nada entra publicado por fora do painel
--
-- NADA depende desta migração. A ingestão grava `status = 'in_review'` e
-- funciona sem ela.
--
-- O que ela resolve: hoje, o ÚNICO obstáculo entre a rota de ingestão e uma
-- matéria publicada é o nosso próprio código. `articles_insert_admin` exige
-- `is_admin()`, mas a chave de serviço ignora RLS inteira; e
-- `guard_article_columns` é `before update` apenas, escapando quem tem
-- `auth.uid() is null`. Uma regressão de uma linha na rota e a promessa
-- "nada publica sozinho" morre em silêncio.
--
-- A doutrina que este projeto escreveu na própria migração de RLS — "a
-- interface esconde o que o usuário não pode fazer; estas policies IMPEDEM"
-- — não tinha contraparte no caminho de insert sem sessão. Isto é a
-- contraparte.
--
-- Nada legítimo quebra: todo insert vindo do painel carrega sessão, e
-- portanto `auth.uid()` não é nulo.
--
-- Para aplicar: cole no editor SQL do Supabase. Para não aplicar: não faça
-- nada.
-- ============================================================================

-- SECURITY INVOKER, de propósito — e é a diferença entre funcionar e não
-- funcionar. Dentro de uma função `security definer`, `current_user` é o DONO
-- da função, nunca quem a chamou: a checagem compararia o dono com
-- 'service_role' e nunca dispararia. A função só levanta exceção, então não
-- precisa de privilégio nenhum emprestado.
create or replace function public.guard_insert_sem_sessao()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- A condição é `current_user`, não `auth.uid() is null`, e a diferença
  -- importa: `auth.uid()` também é nulo em migração, em semente e na suíte de
  -- testes, que legitimamente criam matéria publicada. Guardar por ali
  -- quebraria tudo isso.
  --
  -- `service_role` é o papel com que o PostgREST conecta quando a chamada usa
  -- a chave de serviço — exatamente, e apenas, o caminho da ingestão.
  if current_user <> 'service_role' then
    return new;
  end if;

  if new.status not in ('draft', 'in_review') then
    raise exception
      'matéria vinda de fora do painel entra como rascunho ou em revisão, nunca publicada';
  end if;

  if new.is_premium or new.is_exclusive then
    raise exception 'o acesso da matéria é decisão comercial, definida no painel';
  end if;

  if new.published_at is not null then
    raise exception 'a data de publicação é definida na publicação, pelo painel';
  end if;

  return new;
end;
$$;

drop trigger if exists articles_guard_insert_sem_sessao on public.articles;
create trigger articles_guard_insert_sem_sessao
  before insert on public.articles
  for each row execute function public.guard_insert_sem_sessao();
