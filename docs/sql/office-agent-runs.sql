begin;
create table public.capisol_agent_runs (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.capisol_workspaces(id),
 requested_by uuid not null references auth.users(id), sector smallint not null check(sector between 1 and 72),
 status text not null default 'reserved' check(status in ('reserved','completed','failed')), model text not null,
 output text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.capisol_agent_runs(workspace_id,created_at);
alter table public.capisol_agent_runs enable row level security;
revoke all on public.capisol_agent_runs from anon,authenticated;
grant select on public.capisol_agent_runs to authenticated;
create policy runs_read on public.capisol_agent_runs for select to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager'));
create trigger runs_audit after insert or update on public.capisol_agent_runs for each row execute function public.capisol_office_audit_change();
create function public.capisol_reserve_agent_run(p_workspace uuid,p_user uuid,p_sector int,p_model text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not exists(select 1 from public.capisol_workspace_members where workspace_id=p_workspace and user_id=p_user and role in ('admin','manager')) then raise exception 'not_authorized'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_workspace::text||current_date::text,0));
 if (select count(*) from public.capisol_agent_runs where workspace_id=p_workspace and created_at>=date_trunc('day',now()))>=30 then raise exception 'daily_limit'; end if;
 insert into public.capisol_agent_runs(workspace_id,requested_by,sector,model) values(p_workspace,p_user,p_sector,p_model) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.capisol_reserve_agent_run(uuid,uuid,int,text) from public,anon,authenticated;
grant execute on function public.capisol_reserve_agent_run(uuid,uuid,int,text) to service_role;
commit;
