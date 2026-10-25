begin;
alter table public.capisol_workspace_members add column active boolean not null default true;
create or replace function public.capisol_workspace_role(p_workspace uuid) returns text language sql stable security definer set search_path='' as $$
 select role from public.capisol_workspace_members where workspace_id=p_workspace and user_id=(select auth.uid()) and active
$$;
create or replace function public.capisol_office_add_member(p_workspace uuid,p_email text,p_role text) returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid;
begin
 if public.capisol_workspace_role(p_workspace) is distinct from 'admin' then raise exception 'admin_required'; end if;
 if p_role not in ('manager','operator','viewer') then raise exception 'role_not_allowed'; end if;
 select id into v_user from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null;
 if v_user is null then raise exception 'confirmed_account_required'; end if;
 if exists(select 1 from public.capisol_workspace_members where workspace_id=p_workspace and user_id=v_user and role='admin') then raise exception 'partner_role_protected'; end if;
 insert into public.capisol_workspace_members(workspace_id,user_id,role,active) values(p_workspace,v_user,p_role,true)
 on conflict(workspace_id,user_id) do update set role=excluded.role,active=true;
end $$;
create function public.capisol_office_revoke_member(p_workspace uuid,p_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if public.capisol_workspace_role(p_workspace) is distinct from 'admin' then raise exception 'admin_required'; end if;
 if p_user=auth.uid() or exists(select 1 from public.capisol_workspace_members where workspace_id=p_workspace and user_id=p_user and role='admin') then raise exception 'partner_role_protected'; end if;
 update public.capisol_workspace_members set active=false where workspace_id=p_workspace and user_id=p_user;
end $$;
create function public.capisol_office_members(p_workspace uuid) returns table(user_id uuid,role text,active boolean,display_name text) language sql stable security definer set search_path='' as $$
 select m.user_id,m.role,m.active,coalesce(nullif(u.raw_user_meta_data->>'name',''),u.email)
 from public.capisol_workspace_members m join auth.users u on u.id=m.user_id
 where m.workspace_id=p_workspace and (public.capisol_workspace_role(p_workspace) in ('admin','manager') or (m.user_id=auth.uid() and m.active))
$$;
revoke all on function public.capisol_office_revoke_member(uuid,uuid),public.capisol_office_members(uuid) from public,anon;
grant execute on function public.capisol_office_revoke_member(uuid,uuid),public.capisol_office_members(uuid) to authenticated;
commit;
