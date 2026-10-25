-- Provisionamento controlado multiempresa: convite é aceito pelo titular autenticado.
-- Somente administradores do tenant CAPISOL podem criar CONVITES, não podem ler novos tenants.
begin;
create table public.capisol_tenant_invitations(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 invitee_user_id uuid not null references auth.users(id),
 created_by uuid not null references auth.users(id),
 status text not null default 'pending' check(status in ('pending','accepted','revoked')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '7 days'),
 accepted_at timestamptz,
 unique(workspace_id,invitee_user_id),
 check(expires_at>created_at)
);
create index capisol_tenant_invitations_user on public.capisol_tenant_invitations(invitee_user_id,status);
alter table public.capisol_tenant_invitations enable row level security;
revoke all on public.capisol_tenant_invitations from public,anon,authenticated;
grant select on public.capisol_tenant_invitations to authenticated;
create policy tenant_invitations_read on public.capisol_tenant_invitations for select to authenticated
 using(invitee_user_id=(select auth.uid()) or created_by=(select auth.uid()));

create function public.capisol_invite_new_workspace(p_name text,p_owner_email text,
 p_kind text,p_industry text,p_cnpj text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid; v_owner uuid; v_wid uuid; v_id uuid; v_parent uuid;
begin
 v_actor=(select auth.uid());
 if v_actor is null then raise exception 'auth_required'; end if;
 select id into v_parent from public.capisol_workspaces where cnpj='66360677000149';
 if v_parent is null or public.capisol_workspace_role(v_parent) is distinct from 'admin' then
   raise exception 'platform_admin_required';
 end if;
 if length(btrim(coalesce(p_name,''))) not between 2 and 160 then raise exception 'company_name_invalid'; end if;
 if p_kind not in ('company','rural_producer','cooperative','association') then raise exception 'kind_invalid'; end if;
 if p_industry !~ '^[a-z][a-z0-9_]{1,39}$' then raise exception 'industry_invalid'; end if;
 if p_industry not in ('solar','agriculture','commerce','services','manufacturing','logistics','construction','hospitality','education','health') then
   raise exception 'industry_unsupported';
 end if;
 if p_cnpj is not null and p_cnpj !~ '^[0-9]{14}$' then raise exception 'cnpj_format_invalid'; end if;
 select id into v_owner from auth.users where lower(email)=lower(btrim(p_owner_email)) and email_confirmed_at is not null;
 if v_owner is null then raise exception 'owner_account_must_exist_and_be_verified'; end if;
 if (select count(*) from public.capisol_tenant_invitations where created_by=v_actor and created_at>now()-interval '1 day')>=10 then
   raise exception 'invitation_daily_limit';
 end if;
 insert into public.capisol_workspaces(name,cnpj,kind,industry_code,plan_code)
 values(btrim(p_name),p_cnpj,p_kind,p_industry,'internal') returning id into v_wid;
 insert into public.capisol_tenant_invitations(workspace_id,invitee_user_id,created_by)
 values(v_wid,v_owner,v_actor) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.capisol_invite_new_workspace(text,text,text,text,text) from public,anon;
grant execute on function public.capisol_invite_new_workspace(text,text,text,text,text) to authenticated;

create function public.capisol_accept_workspace_invitation(p_invitation uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_row public.capisol_tenant_invitations%rowtype;
begin
 if (select auth.uid()) is null then raise exception 'auth_required'; end if;
 select * into v_row from public.capisol_tenant_invitations where id=p_invitation for update;
 if v_row.id is null or v_row.invitee_user_id<>(select auth.uid()) then
   raise exception 'invitation_not_found';
 end if;
 if v_row.status<>'pending' or v_row.expires_at<=now() then
   raise exception 'invitation_expired_or_used';
 end if;
 if not exists(select 1 from auth.users where id=(select auth.uid()) and email_confirmed_at is not null) then
   raise exception 'email_verification_required';
 end if;
 if exists(select 1 from public.capisol_workspace_members where workspace_id=v_row.workspace_id and user_id=(select auth.uid())) then
   raise exception 'already_member';
 end if;
 insert into public.capisol_workspace_members(workspace_id,user_id,role,active)
 values(v_row.workspace_id,(select auth.uid()),'admin',true);
 update public.capisol_tenant_invitations set status='accepted',accepted_at=now() where id=v_row.id;
 return v_row.workspace_id;
end $$;
revoke all on function public.capisol_accept_workspace_invitation(uuid) from public,anon;
grant execute on function public.capisol_accept_workspace_invitation(uuid) to authenticated;
commit;
