-- Segurança: memória de IA segregada por tenant; não habilita agentes ou APIs externas.
-- Bloqueia implantação caso existam dados legados que requeiram identificação da empresa.
begin;
do $$ begin
 if exists (select 1 from public.capisol_ia_memoria) then
  raise exception 'memoria_legada_precisa_migracao_manual_por_empresa';
 end if;
end $$;
alter table public.capisol_ia_memoria
 add column if not exists workspace_id uuid references public.capisol_workspaces(id);
alter table public.capisol_ia_memoria alter column workspace_id set not null;
create index if not exists capisol_memoria_workspace_idx on public.capisol_ia_memoria(workspace_id,escopo,status,valido_ate);
drop policy if exists capisol_memoria_ler on public.capisol_ia_memoria;
drop policy if exists capisol_memoria_propor on public.capisol_ia_memoria;
drop policy if exists capisol_memoria_aprovar on public.capisol_ia_memoria;
create policy capisol_memoria_ler_tenant on public.capisol_ia_memoria for select to authenticated
using(
 public.capisol_workspace_role(workspace_id)='admin'
 or (public.capisol_workspace_role(workspace_id) is not null and
  ((status='aprovada' and valido_ate>now()) or criado_por=(select auth.uid())))
);
create policy capisol_memoria_propor_tenant on public.capisol_ia_memoria for insert to authenticated
with check(
 public.capisol_workspace_role(workspace_id) is not null
 and criado_por=(select auth.uid())
 and status='pendente' and aprovado_por is null and aprovado_em is null
);
create policy capisol_memoria_aprovar_tenant on public.capisol_ia_memoria for update to authenticated
using(public.capisol_workspace_role(workspace_id)='admin')
with check(public.capisol_workspace_role(workspace_id)='admin');

create or replace function public.capisol_memoria_workspace_immutable()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.workspace_id is distinct from old.workspace_id or new.criado_por is distinct from old.criado_por then
  raise exception 'memoria_tenant_autor_immutable';
 end if;
 return new;
end $$;
drop trigger if exists capisol_memoria_immutable on public.capisol_ia_memoria;
create trigger capisol_memoria_immutable before update on public.capisol_ia_memoria
for each row execute function public.capisol_memoria_workspace_immutable();
revoke all on public.capisol_ia_memoria from anon;
grant select,insert,update on public.capisol_ia_memoria to authenticated;
-- Policy de leitura não inclui nenhum usuário de outro tenant, mesmo se o usuário for membro do CRM legado.
commit;
