begin;
create or replace function public.capisol_invite_new_workspace(p_name text,p_owner_email text,
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
 if p_industry not in ('solar','agriculture','commerce','services','manufacturing','logistics','construction','hospitality','education','health','mechanics','news_media','faith_nonprofit','food_service','cooperative','professional') then
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
commit;
