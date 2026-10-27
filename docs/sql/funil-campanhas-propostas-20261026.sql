-- CAPISOL / Escritório 4.0: ponte verificável campanha > lead consentido > proposta > venda.
-- Nunca inferir conversão por coincidência de nome/telefone de bases públicas.
create table if not exists public.capisol_atribuicao_propostas (
 proposta_id uuid primary key references public.capisol_proposals(id) on delete cascade,
 workspace_id uuid not null references public.capisol_workspaces(id),
 lead_col text not null default 'leads' check(lead_col='leads'),
 lead_id text not null,
 vinculado_por uuid not null default auth.uid(),
 vinculado_em timestamptz not null default now(),
 constraint capisol_atribuicao_doc_fk foreign key(lead_col,lead_id) references public.docs(col,id)
);
create index if not exists capisol_atribuicao_lead_idx on public.capisol_atribuicao_propostas(workspace_id,lead_id);
alter table public.capisol_atribuicao_propostas enable row level security;
revoke all on public.capisol_atribuicao_propostas from public,anon,authenticated;
grant select,insert,delete on public.capisol_atribuicao_propostas to authenticated;

create policy capisol_atribuicao_gestao_ler
on public.capisol_atribuicao_propostas for select to authenticated
using(public.eh_total() and public.capisol_workspace_role(workspace_id) in ('admin','manager')
 and exists(select 1 from public.capisol_workspaces w where w.id=workspace_id and w.cnpj='66360677000149'));

create policy capisol_atribuicao_gestao_vincular
on public.capisol_atribuicao_propostas for insert to authenticated
with check(public.eh_total() and vinculado_por=(select auth.uid())
 and public.capisol_workspace_role(workspace_id) in ('admin','manager')
 and exists(select 1 from public.capisol_workspaces w where w.id=workspace_id and w.cnpj='66360677000149')
 and exists(select 1 from public.capisol_proposals p where p.id=proposta_id and p.workspace_id=workspace_id)
 and exists(select 1 from public.docs d where d.col='leads' and d.id=lead_id and
   ((d.data->>'origem'='Site' and d.data->>'autContato'='true')
    or (d.data->>'origem'='WhatsApp (API oficial)' and d.data->>'consentimento'='iniciou a conversa'))));

create policy capisol_atribuicao_gestao_desvincular
on public.capisol_atribuicao_propostas for delete to authenticated
using(public.eh_total() and public.capisol_workspace_role(workspace_id) in ('admin','manager')
 and exists(select 1 from public.capisol_workspaces w where w.id=workspace_id and w.cnpj='66360677000149'));

create or replace function public.capisol_funil_campanhas(p_workspace uuid)
returns jsonb language plpgsql stable security definer
set search_path=''
as $$
declare resultado jsonb;
begin
 if (select auth.uid()) is null
   or not public.eh_total()
   or coalesce(public.capisol_workspace_role(p_workspace),'') not in ('admin','manager')
   or not exists(select 1 from public.capisol_workspaces w where w.id=p_workspace and w.cnpj='66360677000149')
 then raise exception 'capisol_campaign_access_required'; end if;

 with leads as (
  select d.id as lead_id,
   coalesce(nullif(btrim(d.data->>'utm_source'),''),
    case when d.data->>'origem'='Site' then 'site_direto' else 'whatsapp' end) as origem,
   coalesce(nullif(btrim(d.data->>'utm_campaign'),''),'sem_campanha') as campanha,
   d.data->>'etapa' etapa
  from public.docs d
  where d.col='leads' and
   ((d.data->>'origem'='Site' and d.data->>'autContato'='true')
    or (d.data->>'origem'='WhatsApp (API oficial)' and d.data->>'consentimento'='iniciou a conversa'))
 ), grupos as (
  select l.origem,l.campanha,count(distinct l.lead_id)::integer recebidos,
   count(distinct a.proposta_id)::integer propostas,
   count(distinct a.proposta_id) filter(where p.status='won')::integer vendas,
   coalesce(sum(p.price) filter(where p.status='won'),0)::numeric(14,2) faturamento,
   coalesce(sum(p.price-p.estimated_cost) filter(where p.status='won'),0)::numeric(14,2) contribuicao_estimada
  from leads l
  left join public.capisol_atribuicao_propostas a on a.lead_id=l.lead_id and a.workspace_id=p_workspace
  left join public.capisol_proposals p on p.id=a.proposta_id and p.workspace_id=p_workspace
  group by l.origem,l.campanha
 ), resumo as (
  select coalesce(sum(recebidos),0)::integer recebidos,
   coalesce(sum(propostas),0)::integer propostas,
   coalesce(sum(vendas),0)::integer vendas,
   coalesce(sum(faturamento),0)::numeric(14,2) faturamento,
   coalesce(sum(contribuicao_estimada),0)::numeric(14,2) contribuicao_estimada
  from grupos
 )
 select jsonb_build_object(
  'atualizado_em',now(),'definicao','apenas leads Site com opt-in ou WhatsApp iniciado pelo interessado',
  'totais',(select to_jsonb(resumo) from resumo),
  'campanhas',coalesce((select jsonb_agg(to_jsonb(x) order by x.recebidos desc,x.origem,x.campanha)
    from (select * from grupos order by recebidos desc,origem,campanha limit 100) x),'[]'::jsonb),
  'sem_ligacao_automatica',true,
  'limites','As vendas dependem de vínculo explícito com proposta status=won; não deduzir por nome ou anúncios.'
 ) into resultado;
 return resultado;
end $$;
revoke all on function public.capisol_funil_campanhas(uuid) from public,anon;
grant execute on function public.capisol_funil_campanhas(uuid) to authenticated;
