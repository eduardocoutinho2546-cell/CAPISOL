begin;
-- Somente capacidades realmente implementadas por RLS podem ser concedidas.
-- Financeiro/fiscal/CRM continuam com as politicas antigas de admin/manager.
alter table public.capisol_workspace_scopes
 add constraint capisol_workspace_scopes_implemented_only
 check(scope in ('rural.read','rural.write','media.read','media.write'));

create or replace function public.capisol_grant_scope(
 p_workspace uuid,p_user uuid,p_scope text,p_active boolean default true
) returns void language plpgsql security definer set search_path='' as $$
begin
 if public.capisol_workspace_role(p_workspace) is distinct from 'admin' then
  raise exception 'admin_required';
 end if;
 if p_scope not in ('rural.read','rural.write','media.read','media.write') then
  raise exception 'scope_not_implemented';
 end if;
 if not exists(select 1 from public.capisol_workspace_members
  where workspace_id=p_workspace and user_id=p_user and active) then
  raise exception 'active_member_required';
 end if;
 insert into public.capisol_workspace_scopes(workspace_id,user_id,scope,granted_by,active)
 values(p_workspace,p_user,p_scope,(select auth.uid()),p_active)
 on conflict(workspace_id,user_id,scope)
 do update set active=excluded.active,granted_by=excluded.granted_by,granted_at=now();
end $$;
revoke all on function public.capisol_grant_scope(uuid,uuid,text,boolean) from public,anon;
grant execute on function public.capisol_grant_scope(uuid,uuid,text,boolean) to authenticated;
commit;
