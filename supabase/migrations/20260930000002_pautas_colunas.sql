-- ============================================================================
-- Correção da revisão final: escopo de coluna no update de pautas
--
-- pautas_admin_update (20260930000001_vigia.sql) restringe a LINHA a quem é
-- admin, mas não restringe a COLUNA — um admin autenticado via PostgREST
-- podia reescrever `tipo_de_fonte`, que é justamente o campo que a spec
-- chama de "o que torna a CON-1 verificável" (fonte de imprensa não alcança
-- o gerador de matéria). RLS é row-level; isto é column-level, e é outra
-- ferramenta — o mesmo raciocínio de 20260922000005_column_privileges.sql.
--
-- MESMA SEMÂNTICA DO POSTGRES que já mordeu este repositório antes:
-- privilégio de coluna só é consultado quando NÃO há privilégio de tabela.
-- Um `grant update (coluna)` sobre quem AINDA tem `update` na tabela inteira
-- não restringe nada — e não avisa. Por isso o `revoke` da tabela vem
-- SEMPRE antes do `grant` coluna a coluna.
-- ============================================================================

revoke update on public.pautas from authenticated;

grant update (estado, article_id) on public.pautas to authenticated;
