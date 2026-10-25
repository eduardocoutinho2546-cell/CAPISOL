-- CAPISOL office v1: additive schema; legacy docs are not moved or deleted.
begin;
create table public.capisol_workspaces (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 160),
 cnpj text unique check(cnpj ~ '^[0-9]{14}$'), created_at timestamptz not null default now()
);
create table public.capisol_workspace_members (
 workspace_id uuid not null references public.capisol_workspaces(id), user_id uuid not null references auth.users(id),
 role text not null check(role in ('admin','manager','operator','viewer')), created_at timestamptz not null default now(),
 primary key(workspace_id,user_id)
);
create index on public.capisol_workspace_members(user_id);
create function public.capisol_workspace_role(p_workspace uuid) returns text language sql stable security definer set search_path='' as $$
 select role from public.capisol_workspace_members where workspace_id=p_workspace and user_id=(select auth.uid())
$$;
revoke all on function public.capisol_workspace_role(uuid) from public,anon;
grant execute on function public.capisol_workspace_role(uuid) to authenticated,service_role;

create table public.capisol_tasks (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.capisol_workspaces(id),
 sector smallint not null check(sector between 1 and 72), title text not null check(length(trim(title)) between 3 and 200),
 objective text not null default '', assignee_id uuid, due_date date, priority smallint not null default 2 check(priority between 1 and 3),
 status text not null default 'planned' check(status in ('planned','active','blocked','review','done','cancelled')),
 evidence text not null default '', source text not null default 'office', created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(workspace_id,assignee_id) references public.capisol_workspace_members(workspace_id,user_id),
 check(status<>'done' or length(trim(evidence))>=10), check(length(objective)<=10000 and length(evidence)<=20000)
);
create table public.capisol_suppliers (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.capisol_workspaces(id),
 name text not null check(length(trim(name)) between 2 and 200), contact text not null default '',
 category text not null default 'equipamentos', notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.capisol_proposals (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.capisol_workspaces(id),
 customer text not null check(length(trim(customer)) between 2 and 200), description text not null default '',
 price numeric(14,2) not null check(price>0), estimated_cost numeric(14,2) not null check(estimated_cost>=0),
 status text not null default 'draft' check(status in ('draft','review','approved','won','lost')),
 valid_until date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.capisol_subscriptions (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.capisol_workspaces(id),
 customer text not null check(length(trim(customer)) between 2 and 200), plan text not null check(length(trim(plan)) between 2 and 200),
 monthly_value numeric(14,2) not null check(monthly_value>=0), next_due date not null,
 status text not null default 'draft' check(status in ('draft','active','paused','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.capisol_fiscal_documents (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.capisol_workspaces(id),
 customer text not null check(length(trim(customer)) between 2 and 200), description text not null check(length(trim(description))>=5),
 amount numeric(14,2) not null check(amount>0), payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),
 status text not null default 'draft' check(status in ('draft','review','approved','processing','authorized','rejected','uncertain')),
 environment text not null default 'homologation' check(environment in ('homologation','production')),
 approved_by uuid references auth.users(id), approved_at timestamptz, provider_status text, xml_url text, pdf_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.capisol_bank_connections (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.capisol_workspaces(id),
 provider_item_id text not null unique, unique(workspace_id,id), status text not null, consent_recorded_at timestamptz not null default now(),
 synced_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.capisol_bank_transactions (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.capisol_workspaces(id),
 connection_id uuid not null, foreign key(workspace_id,connection_id) references public.capisol_bank_connections(workspace_id,id), provider_transaction_id text not null unique,
 account_id text not null, date date not null, description text not null, amount numeric(16,2) not null,
 currency text not null default 'BRL', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.capisol_office_audit (
 id bigint generated always as identity primary key, workspace_id uuid not null references public.capisol_workspaces(id),
 actor uuid, entity text not null, record_id text not null, action text not null, at timestamptz not null default now()
);
create index on public.capisol_office_audit(workspace_id,at desc);
create function public.capisol_office_audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.capisol_office_audit(workspace_id,actor,entity,record_id,action)
 values(new.workspace_id,auth.uid(),TG_TABLE_NAME,coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'user_id'),TG_OP);
 return new;
end $$;
revoke all on function public.capisol_office_audit_change() from public,anon,authenticated;
create function public.capisol_office_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' then
   if new.workspace_id<>old.workspace_id or new.id<>old.id then raise exception 'immutable_identity'; end if;
   new.updated_at=now();
 end if;
 if TG_TABLE_NAME='capisol_tasks' then
   if TG_OP='INSERT' and current_user<>'service_role' and new.created_by<>auth.uid() then raise exception 'invalid_creator'; end if;
   if TG_OP='UPDATE' and new.created_by<>old.created_by then raise exception 'immutable_creator'; end if;
 end if;
 if TG_TABLE_NAME='capisol_fiscal_documents' and current_user not in ('service_role','postgres') then
   if new.status not in ('draft','review') or new.approved_by is not null or new.approved_at is not null
      or new.provider_status is not null or new.xml_url is not null or new.pdf_url is not null then raise exception 'fiscal_server_only'; end if;
   if TG_OP='UPDATE' and old.status not in ('draft','review') then raise exception 'fiscal_locked'; end if;
 end if;
 return new;
end $$;
revoke all on function public.capisol_office_guard() from public,anon,authenticated;

alter table public.capisol_workspaces enable row level security;
alter table public.capisol_workspace_members enable row level security;
alter table public.capisol_office_audit enable row level security;
revoke all on public.capisol_workspaces,public.capisol_workspace_members,public.capisol_office_audit from anon,authenticated;
grant select on public.capisol_workspaces,public.capisol_workspace_members,public.capisol_office_audit to authenticated;
create policy workspace_read on public.capisol_workspaces for select to authenticated using(public.capisol_workspace_role(id) is not null);
create policy members_read on public.capisol_workspace_members for select to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager') or user_id=auth.uid());
create policy audit_read on public.capisol_office_audit for select to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager'));

do $$ declare t text; begin
 foreach t in array array['capisol_tasks','capisol_suppliers','capisol_proposals','capisol_subscriptions','capisol_fiscal_documents','capisol_bank_connections','capisol_bank_transactions'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create index on public.%I(workspace_id)',t);
  execute format('create trigger audit_change after insert or update on public.%I for each row execute function public.capisol_office_audit_change()',t);
  execute format('create trigger guard_change before insert or update on public.%I for each row execute function public.capisol_office_guard()',t);
  if t='capisol_tasks' then
   execute format('grant insert,update on public.%I to authenticated',t);
   execute format('create policy read_rows on public.%I for select to authenticated using(public.capisol_workspace_role(workspace_id) in (''admin'',''manager'') or (public.capisol_workspace_role(workspace_id) is not null and assignee_id=auth.uid()))',t);
   execute format('create policy create_rows on public.%I for insert to authenticated with check(public.capisol_workspace_role(workspace_id) in (''admin'',''manager'') or (public.capisol_workspace_role(workspace_id)=''operator'' and assignee_id=auth.uid() and created_by=auth.uid()))',t);
   execute format('create policy update_rows on public.%I for update to authenticated using(public.capisol_workspace_role(workspace_id) in (''admin'',''manager'') or (public.capisol_workspace_role(workspace_id)=''operator'' and assignee_id=auth.uid())) with check(public.capisol_workspace_role(workspace_id) in (''admin'',''manager'') or (public.capisol_workspace_role(workspace_id)=''operator'' and assignee_id=auth.uid()))',t);
  else
   execute format('create policy read_rows on public.%I for select to authenticated using(public.capisol_workspace_role(workspace_id) in (''admin'',''manager''))',t);
   if t not in ('capisol_bank_connections','capisol_bank_transactions') then
    execute format('grant insert,update on public.%I to authenticated',t);
    execute format('create policy create_rows on public.%I for insert to authenticated with check(public.capisol_workspace_role(workspace_id) in (''admin'',''manager''))',t);
    execute format('create policy update_rows on public.%I for update to authenticated using(public.capisol_workspace_role(workspace_id) in (''admin'',''manager'')) with check(public.capisol_workspace_role(workspace_id) in (''admin'',''manager''))',t);
   end if;
  end if;
 end loop;
end $$;
create trigger member_audit after insert or update on public.capisol_workspace_members for each row execute function public.capisol_office_audit_change();

-- Known partners only: match the existing authenticated accounts; no shared password or new privilege inferred.
insert into public.capisol_workspaces(name,cnpj) values('CAPISOL Energia Solar','66360677000149');
insert into public.capisol_workspace_members(workspace_id,user_id,role)
 select w.id,u.id,'admin' from public.capisol_workspaces w cross join auth.users u
 where w.cnpj='66360677000149' and lower(u.email) in ('queiroz.solar68@gmail.com','eduardo.coutinho2546@gmail.com');

create function public.capisol_office_add_member(p_workspace uuid,p_email text,p_role text) returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid;
begin
 if public.capisol_workspace_role(p_workspace)<>'admin' or public.capisol_workspace_role(p_workspace) is null then raise exception 'admin_required'; end if;
 if p_role not in ('manager','operator','viewer') then raise exception 'role_not_allowed'; end if;
 select id into v_user from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null;
 if v_user is null then raise exception 'confirmed_account_required'; end if;
 if exists(select 1 from public.capisol_workspace_members where workspace_id=p_workspace and user_id=v_user and role='admin') then raise exception 'partner_role_protected'; end if;
 insert into public.capisol_workspace_members(workspace_id,user_id,role) values(p_workspace,v_user,p_role)
 on conflict(workspace_id,user_id) do update set role=excluded.role;
end $$;
revoke all on function public.capisol_office_add_member(uuid,text,text) from public,anon;
grant execute on function public.capisol_office_add_member(uuid,text,text) to authenticated;
revoke delete,truncate,references,trigger on public.capisol_cotacoes_ia from authenticated;
commit;
