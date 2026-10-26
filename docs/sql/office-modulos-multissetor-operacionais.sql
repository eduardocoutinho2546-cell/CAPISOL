-- CAPISOL Gestão: módulos operacionais compartilhados por workspace.
-- NÃO instala provedor, não cria usuários ou empresas e NÃO realiza compra, cobrança ou publicação.
begin;
create table if not exists public.capisol_org_units(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 parent_id uuid,
 name text not null check(length(btrim(name)) between 2 and 140),
 unit_type text not null check(unit_type in ('headquarters','branch','warehouse','farm','workshop','newsroom','church','school','clinic','other')),
 city text,
 state_code text,
 country_code text not null default 'BR' check(country_code ~ '^[A-Z]{2}$'),
 created_at timestamptz not null default now(),
 unique(workspace_id,id),
 foreign key(workspace_id,parent_id) references public.capisol_org_units(workspace_id,id),
 check(parent_id is distinct from id)
);
create index if not exists capisol_org_units_workspace on public.capisol_org_units(workspace_id);
alter table public.capisol_org_units enable row level security;
revoke all on public.capisol_org_units from public,anon,authenticated;
grant select,insert on public.capisol_org_units to authenticated;
create policy capisol_org_units_read on public.capisol_org_units for select to authenticated using(public.capisol_workspace_role(workspace_id) is not null);
create policy capisol_org_units_insert on public.capisol_org_units for insert to authenticated with check(public.capisol_workspace_role(workspace_id) in ('admin','manager'));

create table if not exists public.capisol_stock_items(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 org_unit_id uuid not null,
 sku text not null check(length(btrim(sku)) between 1 and 64),
 name text not null check(length(btrim(name)) between 2 and 180),
 unit text not null default 'un' check(unit in ('un','kg','g','l','ml','m','m2','box','bag')),
 quantity numeric(16,3) not null default 0 check(quantity>=0),
 min_quantity numeric(16,3) not null default 0 check(min_quantity>=0),
 created_at timestamptz not null default now(),
 unique(workspace_id,id),
 unique(workspace_id,org_unit_id,sku),
 foreign key(workspace_id,org_unit_id) references public.capisol_org_units(workspace_id,id)
);
create index if not exists capisol_stock_items_unit on public.capisol_stock_items(workspace_id,org_unit_id);
alter table public.capisol_stock_items enable row level security;
revoke all on public.capisol_stock_items from public,anon,authenticated;
grant select,insert on public.capisol_stock_items to authenticated;
create policy capisol_stock_items_read on public.capisol_stock_items for select to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager'));
create policy capisol_stock_items_insert on public.capisol_stock_items for insert to authenticated with check(public.capisol_workspace_role(workspace_id) in ('admin','manager') and quantity=0);

create table if not exists public.capisol_stock_moves(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 stock_item_id uuid not null,
 request_id uuid not null,
 move_type text not null check(move_type in ('in','out')),
 quantity numeric(16,3) not null check(quantity>0 and quantity<=1000000),
 balance_after numeric(16,3) not null check(balance_after>=0),
 reason text not null check(length(btrim(reason)) between 5 and 500),
 actor_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(workspace_id,request_id),
 foreign key(workspace_id,stock_item_id) references public.capisol_stock_items(workspace_id,id)
);
create index if not exists capisol_stock_moves_item on public.capisol_stock_moves(workspace_id,stock_item_id,created_at desc);
alter table public.capisol_stock_moves enable row level security;
revoke all on public.capisol_stock_moves from public,anon,authenticated;
grant select on public.capisol_stock_moves to authenticated;
create policy capisol_stock_moves_read on public.capisol_stock_moves for select to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager'));

create function public.capisol_stock_move(p_workspace uuid,p_item uuid,p_request uuid,p_type text,p_quantity numeric,p_reason text)
returns numeric language plpgsql security definer set search_path='' as $$
declare v_current numeric; v_previous public.capisol_stock_moves%rowtype;v_new numeric;
begin
 if public.capisol_workspace_role(p_workspace) not in ('admin','manager') then raise exception 'manager_required';end if;
 if p_request is null or p_item is null or p_quantity is null or p_quantity<=0 or p_quantity>1000000
  or p_type not in ('in','out') or length(btrim(coalesce(p_reason,''))) not between 5 and 500 then
  raise exception 'invalid_inventory_movement';
 end if;
 select quantity into v_current from public.capisol_stock_items
 where workspace_id=p_workspace and id=p_item for update;
 if not found then raise exception 'stock_item_not_found';end if;
 select * into v_previous from public.capisol_stock_moves where workspace_id=p_workspace and request_id=p_request;
 if found then
  if v_previous.stock_item_id<>p_item or v_previous.move_type<>p_type or v_previous.quantity<>p_quantity
   or v_previous.reason<>p_reason then raise exception 'request_id_conflict';end if;
  return v_previous.balance_after;
 end if;
 v_new=v_current+case when p_type='in' then p_quantity else -p_quantity end;
 if v_new<0 then raise exception 'insufficient_stock';end if;
 update public.capisol_stock_items set quantity=v_new where workspace_id=p_workspace and id=p_item;
 insert into public.capisol_stock_moves(workspace_id,stock_item_id,request_id,move_type,quantity,balance_after,reason,actor_id)
 values(p_workspace,p_item,p_request,p_type,p_quantity,v_new,p_reason,(select auth.uid()));
 return v_new;
end $$;
revoke all on function public.capisol_stock_move(uuid,uuid,uuid,text,numeric,text) from public,anon;
grant execute on function public.capisol_stock_move(uuid,uuid,uuid,text,numeric,text) to authenticated;

create table if not exists public.capisol_crop_cycles(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 property_id uuid not null,
 culture text not null check(length(btrim(culture)) between 2 and 140),
 cultivar text,
 planting_date date,
 forecast_harvest_date date,
 area_ha numeric(13,3) check(area_ha>0 and area_ha<100000000),
 stage text not null default 'planning' check(stage in ('planning','planted','growing','harvesting','closed','cancelled')),
 agronomist_review text not null default 'not_reviewed' check(agronomist_review in ('not_reviewed','pending','reviewed')),
 created_at timestamptz not null default now(),
 unique(workspace_id,id),
 foreign key(workspace_id,property_id) references public.capisol_rural_properties(workspace_id,id),
 check(forecast_harvest_date is null or planting_date is null or forecast_harvest_date>=planting_date)
);
create index if not exists capisol_crop_cycles_property on public.capisol_crop_cycles(workspace_id,property_id);
alter table public.capisol_crop_cycles enable row level security;
revoke all on public.capisol_crop_cycles from public,anon,authenticated;
grant select,insert on public.capisol_crop_cycles to authenticated;
create policy capisol_crop_cycles_read on public.capisol_crop_cycles for select to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.read') or public.capisol_has_scope(workspace_id,'rural.write'));
create policy capisol_crop_cycles_insert on public.capisol_crop_cycles for insert to authenticated with check(public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.write'));

create table if not exists public.capisol_crop_observations(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 crop_cycle_id uuid not null,
 observed_on date not null,
 growth_stage text not null check(length(btrim(growth_stage)) between 2 and 80),
 note text not null check(length(btrim(note)) between 5 and 2000),
 risk_flag text not null default 'none' check(risk_flag in ('none','pest_suspected','disease_suspected','water_stress','other')),
 professional_review text not null default 'pending' check(professional_review in ('pending','reviewed')),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(workspace_id,crop_cycle_id) references public.capisol_crop_cycles(workspace_id,id)
);
create index if not exists capisol_crop_observations_cycle on public.capisol_crop_observations(workspace_id,crop_cycle_id,observed_on desc);
alter table public.capisol_crop_observations enable row level security;
revoke all on public.capisol_crop_observations from public,anon,authenticated;
grant select,insert on public.capisol_crop_observations to authenticated;
create policy capisol_crop_observations_read on public.capisol_crop_observations for select to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.read') or public.capisol_has_scope(workspace_id,'rural.write'));
create policy capisol_crop_observations_insert on public.capisol_crop_observations for insert to authenticated with check((public.capisol_workspace_role(workspace_id) in ('admin','manager') or public.capisol_has_scope(workspace_id,'rural.write')) and created_by=(select auth.uid()) and professional_review='pending');

create table if not exists public.capisol_work_orders(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 org_unit_id uuid not null,
 sector text not null check(sector in ('mechanics','solar','field','retail','facility','agriculture','other')),
 reference text not null check(length(btrim(reference)) between 3 and 120),
 asset_label text not null check(length(btrim(asset_label)) between 2 and 180),
 description text not null check(length(btrim(description)) between 8 and 3000),
 status text not null default 'draft' check(status in ('draft','triage','approved','in_progress','review','done','cancelled')),
 estimated_cost numeric(16,2) check(estimated_cost>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(workspace_id,reference),
 foreign key(workspace_id,org_unit_id) references public.capisol_org_units(workspace_id,id)
);
create index if not exists capisol_work_orders_unit on public.capisol_work_orders(workspace_id,org_unit_id,status);
alter table public.capisol_work_orders enable row level security;
revoke all on public.capisol_work_orders from public,anon,authenticated;
grant select,insert,update on public.capisol_work_orders to authenticated;
create policy capisol_work_orders_read on public.capisol_work_orders for select to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager'));
create policy capisol_work_orders_insert on public.capisol_work_orders for insert to authenticated with check(public.capisol_workspace_role(workspace_id) in ('admin','manager') and status='draft');
create policy capisol_work_orders_update on public.capisol_work_orders for update to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager')) with check(public.capisol_workspace_role(workspace_id) in ('admin','manager'));

create table if not exists public.capisol_newsroom_stories(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 title text not null check(length(btrim(title)) between 6 and 250),
 summary text not null default '',
 source_url text,
 source_checked boolean not null default false,
 correction_of uuid,
 status text not null default 'pitch' check(status in ('pitch','investigating','factcheck','editing','review','approved','archived')),
 created_at timestamptz not null default now(),
 unique(workspace_id,id),
 foreign key(workspace_id,correction_of) references public.capisol_newsroom_stories(workspace_id,id)
);
alter table public.capisol_newsroom_stories enable row level security;
revoke all on public.capisol_newsroom_stories from public,anon,authenticated;
grant select,insert,update on public.capisol_newsroom_stories to authenticated;
create policy capisol_news_stories_read on public.capisol_newsroom_stories for select to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager'));
create policy capisol_news_stories_insert on public.capisol_newsroom_stories for insert to authenticated with check(public.capisol_workspace_role(workspace_id) in ('admin','manager') and status='pitch');
create policy capisol_news_stories_update on public.capisol_newsroom_stories for update to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager')) with check(public.capisol_workspace_role(workspace_id) in ('admin','manager'));

create table if not exists public.capisol_community_events(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 title text not null check(length(btrim(title)) between 4 and 220),
 venue text,
 starts_at timestamptz not null,
 ends_at timestamptz,
 event_kind text not null default 'community' check(event_kind in ('community','faith','volunteer','education','fundraiser','other')),
 status text not null default 'draft' check(status in ('draft','review','approved','cancelled')),
 created_at timestamptz not null default now(),
 check(ends_at is null or ends_at>starts_at)
);
alter table public.capisol_community_events enable row level security;
revoke all on public.capisol_community_events from public,anon,authenticated;
grant select,insert,update on public.capisol_community_events to authenticated;
create policy capisol_events_read on public.capisol_community_events for select to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager'));
create policy capisol_events_insert on public.capisol_community_events for insert to authenticated with check(public.capisol_workspace_role(workspace_id) in ('admin','manager') and status='draft');
create policy capisol_events_update on public.capisol_community_events for update to authenticated using(public.capisol_workspace_role(workspace_id) in ('admin','manager')) with check(public.capisol_workspace_role(workspace_id) in ('admin','manager'));
commit;
