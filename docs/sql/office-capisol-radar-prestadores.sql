-- CAPISOL: radar de candidatos AC/RO, sem contato, contrato ou homologação automáticos.
begin;
create table if not exists public.capisol_partner_radar(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.capisol_workspaces(id),
 external_key text not null check(external_key ~ '^[a-z0-9-]{3,80}$'),
 name text not null check(length(btrim(name)) between 2 and 160),
 uf text not null check(uf in ('AC','RO')),
 municipality text not null check(length(btrim(municipality)) between 2 and 120),
 category text not null check(length(btrim(category)) between 3 and 80),
 services text[] not null default '{}',
 phone text,
 email text,
 source_url text not null check(source_url ~ '^https://[^[:space:]]+$'),
 source_type text not null check(source_type in ('site_empresa','diretorio','guia_local')),
 classification text not null check(classification in ('concorrente_potencial','prestador_potencial','fornecedor_potencial')),
 notes text not null default '',
 stage text not null default 'identificado' check(stage in ('identificado','em_analise','contatado','documentos_pendentes','descartado')),
 relationship_confirmed boolean not null default false check(relationship_confirmed=false),
 qualified boolean not null default false check(qualified=false),
 source_checked_at date not null,
 last_contact_at timestamptz,
 review_note text not null default '',
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 unique(workspace_id,external_key),
 check(length(review_note)<=1200)
);
create index if not exists capisol_partner_radar_workspace_stage on public.capisol_partner_radar(workspace_id,uf,stage);
alter table public.capisol_partner_radar enable row level security;
revoke all on public.capisol_partner_radar from public,anon,authenticated;
grant select on public.capisol_partner_radar to authenticated;
create policy partner_radar_read on public.capisol_partner_radar for select to authenticated
 using(public.capisol_workspace_role(workspace_id) in ('admin','manager'));
alter table public.capisol_partner_radar
 add constraint capisol_partner_radar_workspace_id_unique unique(workspace_id,id);
create table if not exists public.capisol_partner_radar_reviews(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null,
 candidate_id uuid not null,
 old_stage text not null,
 next_stage text not null,
 reason text not null check(length(btrim(reason)) between 5 and 1200),
 actor_id uuid not null references auth.users(id),
 at timestamptz not null default now(),
 foreign key(workspace_id,candidate_id) references public.capisol_partner_radar(workspace_id,id)
);

create index if not exists partner_reviews_recent on public.capisol_partner_radar_reviews(workspace_id,at desc);
alter table public.capisol_partner_radar_reviews enable row level security;
revoke all on public.capisol_partner_radar_reviews from public,anon,authenticated;
grant select on public.capisol_partner_radar_reviews to authenticated;
create policy partner_reviews_read on public.capisol_partner_radar_reviews for select to authenticated
 using(public.capisol_workspace_role(workspace_id) in ('admin','manager'));

create function public.capisol_partner_review(
 p_workspace uuid,p_candidate uuid,p_stage text,p_reason text
) returns text language plpgsql security definer set search_path='' as $$
declare v_old text;
begin
 if public.capisol_workspace_role(p_workspace) not in ('admin','manager') then raise exception 'manager_required';end if;
 if p_stage not in ('identificado','em_analise','contatado','documentos_pendentes','descartado') then raise exception 'invalid_stage';end if;
 if length(btrim(coalesce(p_reason,''))) not between 5 and 1200 then raise exception 'review_reason_required';end if;
 select stage into v_old from public.capisol_partner_radar where id=p_candidate and workspace_id=p_workspace for update;
 if not found then raise exception 'candidate_not_found_in_workspace';end if;
 if v_old=p_stage then raise exception 'same_stage_no_action';end if;
 update public.capisol_partner_radar set stage=p_stage,review_note=btrim(p_reason),reviewed_by=(select auth.uid()),
 reviewed_at=now(),last_contact_at=case when p_stage='contatado' then now() else last_contact_at end
 where id=p_candidate and workspace_id=p_workspace;
 insert into public.capisol_partner_radar_reviews(workspace_id,candidate_id,old_stage,next_stage,reason,actor_id)
 values(p_workspace,p_candidate,v_old,p_stage,btrim(p_reason),(select auth.uid()));
 return p_stage;
end $$;
revoke all on function public.capisol_partner_review(uuid,uuid,text,text) from public,anon;
grant execute on function public.capisol_partner_review(uuid,uuid,text,text) to authenticated;
commit;
