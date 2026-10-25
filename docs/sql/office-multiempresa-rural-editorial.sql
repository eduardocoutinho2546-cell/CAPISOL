-- CAPISOL Gestao 4.0 / multiempresa, rural e pipeline editorial.
-- Aditivo: nao altera capisol_workspace_members.role nem dados do CRM legado.
-- Sem criacao automatica de tenants, envios de posts ou cobranças.
begin;
alter table public.capisol_workspaces
 add column if not exists kind text not null default 'company'
 check (kind in ('company','rural_producer','cooperative','association'));
alter table public.capisol_workspaces
 add column if not exists industry_code text not null default 'solar'
 check (industry_code ~ '^[a-z][a-z0-9_]{1,39}$');
alter table public.capisol_workspaces
 add column if not exists plan_code text not null default 'internal'
 check (plan_code in ('internal','demo','starter','business','enterprise'));
-- plan_code is informative; NEVER activate billing or permissions from the client alone.

create table if not exists public.capisol_workspace_scopes (
 workspace_id uuid not null,
 user_id uuid not null,
 scope text not null check(scope in ('rural.read','rural.write','media.read','media.write','analytics.read','finance.read','fiscal.read','crm.read','crm.write')),
 granted_by uuid not null references auth.users(id),
 granted_at timestamptz not null default now(),
 active boolean not null default true,
 primary key(workspace_id,user_id,scope),
 foreign key(workspace_id,user_id) references public.capisol_workspace_members(workspace_id,user_id)
);
create index if not exists capisol_scopes_user on public.capisol_workspace_scopes(user_id,workspace_id);
alter table public.capisol_workspace_scopes enable row level security;
revoke all on public.capisol_workspace_scopes from anon, authenticated;
grant select on public.capisol_workspace_scopes to authenticated;
create policy scopes_read_own on public.capisol_workspace_scopes for select to authenticated
 using ((select auth.uid())=user_id and public.capisol_workspace_role(workspace_id) is not null
    or public.capisol_workspace_role(workspace_id)='admin');

create or replace function public.capisol_has_scope(p_workspace uuid,p_scope text)
returns boolean language sql stable security definer set search_path='' as $$
 select
 public.capisol_workspace_role(p_workspace) = 'admin'
 or (public.capisol_workspace_role(p_workspace) is not null and exists (
  select 1 from public.capisol_workspace_scopes g
  where g.workspace_id=p_workspace and g.user_id=(select auth.uid())
   and g.scope=p_scope and g.active
 ))
$$;
revoke all on function public.capisol_has_scope(uuid,text) from public,anon;
grant execute on function public.capisol_has_scope(uuid,text) to authenticated;

create or replace function public.capisol_grant_scope(
 p_workspace uuid,p_user uuid,p_scope text,p_active boolean default true
) returns void language plpgsql security definer set search_path='' as $$
begin
 if public.capisol_workspace_role(p_workspace) is distinct from 'admin' then
  raise exception 'admin_required';
 end if;
 if p_scope not in ('rural.read','rural.write','media.read','media.write','analytics.read','finance.read','fiscal.read','crm.read','crm.write') then
  raise exception 'invalid_scope';
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

create table if not exists public.capisol_rural_producers (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 display_name text not null check(length(btrim(display_name)) between 2 and 180),
 kind text not null default 'person' check(kind in ('person','organization','cooperative')),
 document_last4 text check(document_last4 ~ '^[0-9]{4}$'),
 municipality text not null check(length(btrim(municipality)) between 2 and 120),
 state_code text not null default 'AC' check(state_code ~ '^[A-Z]{2}$'),
 main_activity text not null default 'mixed' check(main_activity in ('crops','livestock','agroforestry','aquaculture','mixed','other')),
 consent_confirmed boolean not null default false,
 verification_state text not null default 'draft' check(verification_state in ('draft','pending','verified')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(workspace_id,id)
);
create index if not exists rural_producers_workspace on public.capisol_rural_producers(workspace_id);
alter table public.capisol_rural_producers enable row level security;
revoke all on public.capisol_rural_producers from public,anon,authenticated;
grant select,insert,update on public.capisol_rural_producers to authenticated;
create policy rural_producers_read on public.capisol_rural_producers for select to authenticated
 using (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.read') or public.capisol_has_scope(workspace_id,'rural.write'));
create policy rural_producers_insert on public.capisol_rural_producers for insert to authenticated
 with check (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.write'));
create policy rural_producers_update on public.capisol_rural_producers for update to authenticated
 using (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.write'))
 with check (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.write'));

create table if not exists public.capisol_rural_properties (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 producer_id uuid not null,
 name text not null check(length(btrim(name)) between 2 and 180),
 municipality text not null check(length(btrim(municipality)) between 2 and 120),
 state_code text not null default 'AC' check(state_code ~ '^[A-Z]{2}$'),
 hectares numeric(13,3) check(hectares>=0 and hectares<=100000000),
 activity text not null default 'mixed' check(activity in ('crops','livestock','agroforestry','aquaculture','mixed','other')),
 registry_last4 text check(registry_last4 ~ '^[0-9A-Za-z]{4}$'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(workspace_id,id),
 foreign key(workspace_id,producer_id) references public.capisol_rural_producers(workspace_id,id)
);
create index if not exists rural_properties_workspace on public.capisol_rural_properties(workspace_id,producer_id);
alter table public.capisol_rural_properties enable row level security;
revoke all on public.capisol_rural_properties from public,anon,authenticated;
grant select,insert,update on public.capisol_rural_properties to authenticated;
create policy rural_properties_read on public.capisol_rural_properties for select to authenticated
 using (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.read') or public.capisol_has_scope(workspace_id,'rural.write'));
create policy rural_properties_insert on public.capisol_rural_properties for insert to authenticated
 with check (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.write'));
create policy rural_properties_update on public.capisol_rural_properties for update to authenticated
 using (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.write'))
 with check (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.write'));

create table if not exists public.capisol_media_jobs (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 created_by uuid not null default auth.uid() references auth.users(id),
 title text not null check(length(btrim(title)) between 3 and 180),
 original_storage_path text not null check(length(btrim(original_storage_path)) between 4 and 800 and original_storage_path !~ '^https?://'),
 media_kind text not null default 'video' check(media_kind in ('video','audio','image')),
 rights_confirmed boolean not null default false,
 state text not null default 'draft' check(state in ('draft','editing','review','approved','cancelled')),
 instructions text not null default '',
 output_storage_path text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(length(instructions)<=10000)
);
create index if not exists media_jobs_workspace on public.capisol_media_jobs(workspace_id,created_at desc);
alter table public.capisol_media_jobs enable row level security;
revoke all on public.capisol_media_jobs from public,anon,authenticated;
grant select,insert,update on public.capisol_media_jobs to authenticated;
create policy media_jobs_read on public.capisol_media_jobs for select to authenticated
 using (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'media.read') or public.capisol_has_scope(workspace_id,'media.write'));
create policy media_jobs_insert on public.capisol_media_jobs for insert to authenticated
 with check ((public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'media.write')) and created_by=(select auth.uid()));
create policy media_jobs_update on public.capisol_media_jobs for update to authenticated
 using (public.capisol_workspace_role(workspace_id) in ('admin','manager') or (public.capisol_has_scope(workspace_id,'media.write') and created_by=(select auth.uid())))
 with check (public.capisol_workspace_role(workspace_id) in ('admin','manager') or (public.capisol_has_scope(workspace_id,'media.write') and created_by=(select auth.uid())));

create table if not exists public.capisol_content_tracks (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 cluster_no smallint not null check(cluster_no between 1 and 12),
 strand_no smallint not null check(strand_no between 1 and 5),
 label text not null check(length(btrim(label)) between 2 and 120),
 platform text not null default 'internal' check(platform in ('internal','instagram','facebook','tiktok','youtube','linkedin','x','pinterest')),
 status text not null default 'planned' check(status in ('planned','in_review','approved','paused')),
 public_account_authorized boolean not null default false,
 created_at timestamptz not null default now(),
 unique(workspace_id,cluster_no,strand_no)
);
create index if not exists content_tracks_workspace on public.capisol_content_tracks(workspace_id);
alter table public.capisol_content_tracks enable row level security;
revoke all on public.capisol_content_tracks from public,anon,authenticated;
grant select,insert,update on public.capisol_content_tracks to authenticated;
create policy content_tracks_read on public.capisol_content_tracks for select to authenticated
 using (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'media.read') or public.capisol_has_scope(workspace_id,'media.write'));
create policy content_tracks_insert on public.capisol_content_tracks for insert to authenticated
 with check (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'media.write'));
create policy content_tracks_update on public.capisol_content_tracks for update to authenticated
 using (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'media.write'))
 with check (public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'media.write'));

-- Non-admin users cannot change workspace kind, billing, or tenant identity.
-- No INSERT grants on workspaces. All new tenants require a separate protected onboarding service.
commit;
