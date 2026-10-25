begin;
-- This relation is a security-invoker view, not a table; RLS belongs to its underlying tables.
alter view public.capisol_tabela_fornecedor set (security_invoker=true);
revoke all on public.capisol_tabela_fornecedor from anon,authenticated;
grant select on public.capisol_tabela_fornecedor to authenticated;
comment on view public.capisol_tabela_fornecedor is 'Consulta de custos: security_invoker respeita RLS das tabelas capisol_fila_belenergy e capisol_cotacoes_ia. Cliente somente leitura.';
commit;
