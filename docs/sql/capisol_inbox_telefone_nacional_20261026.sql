-- CAPISOL - caixa de entrada comercial, sem duplicar CRM ou publicar dados.
-- Instalação sobre função existente, preserva assinaturas e privilégios anteriores.
create or replace function public.capisol_office_legacy_insights(p_workspace uuid)
returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare
 counts jsonb;
 quality jsonb;
 stages jsonb;
 sources jsonb;
 inbox jsonb;
begin
 if (select auth.uid()) is null
    or coalesce(public.capisol_workspace_role(p_workspace),'') not in ('admin','manager')
    or not public.eh_total()
 then raise exception 'legacy_access_required'; end if;
 if not exists(select 1 from public.capisol_workspaces
               where id=p_workspace and cnpj='66360677000149')
 then raise exception 'legacy_workspace_mismatch'; end if;

 select coalesce(jsonb_object_agg(col,n),'{}'::jsonb)
   into counts
 from (select col,count(*) n from public.docs
       where col in ('leads','clientes','propostas','contratos','obras','os','assinaturas')
       group by col) x;

 select jsonb_build_object(
   'leads_without_phone',count(*) filter(where col='leads' and
     length(regexp_replace(coalesce(data->>'fone',''),'[^0-9]','','g'))<10),
   'leads_without_source',count(*) filter(where col='leads' and
     trim(coalesce(data->>'origem',''))=''),
   'leads_without_owner',count(*) filter(where col='leads' and
     trim(coalesce(data->>'vendedor',''))=''),
   'accepted_proposals',count(*) filter(where col='propostas' and data->>'status'='Aceita'),
   'active_subscriptions_missing_price',count(*) filter(where col='assinaturas'
     and data->>'status'='Ativo' and coalesce(data->>'mensalidade','') in ('','0')),
   'inbound_site_total',count(*) filter(where col='leads'
     and data->>'origem'='Site' and data->>'autContato'='true')
 ) into quality from public.docs where col in ('leads','propostas','assinaturas');

 select coalesce(jsonb_object_agg(stage,n),'{}'::jsonb)
 into stages from (select coalesce(nullif(data->>'etapa',''),'Sem etapa') stage,count(*) n
                   from public.docs where col='leads' group by 1) x;

 select coalesce(jsonb_object_agg(source,n),'{}'::jsonb)
 into sources from (select coalesce(nullif(data->>'origem',''),'Sem origem') source,count(*) n
                    from public.docs where col='leads' group by 1) x;

 -- Somente solicitações iniciadas pelo próprio titular e com consentimento de resposta.
 -- Nenhum contato prospectado/raspado entra nesta fila.
 select coalesce(jsonb_agg(jsonb_build_object(
   'id', x.id,
   'nome', x.data->>'nome',
   'fone', x.data->>'fone',
   'interesse', x.data->>'interesse',
   'cidade', x.data->>'cidade',
   'etapa', x.data->>'etapa',
   'recebido_em', x.data->>'recebidoEm'
 ) order by x.updated_at desc),'[]'::jsonb) into inbox
 from (
  select id, data, updated_at
  from public.docs
  where col='leads'
    and data->>'origem'='Site'
    and data->>'autContato'='true'
    and length(regexp_replace(coalesce(data->>'fone',''),'[^0-9]','','g')) between 10 and 13
  order by updated_at desc
  limit 25
 ) x;

 return jsonb_build_object(
  'source','public.docs','checked_at',now(),
  'counts',counts,'quality',quality,'lead_stages',stages,
  'lead_origins',sources,'inbound_site',inbox,
  'scope','historical_all_records'
 );
end $$;

revoke all on function public.capisol_office_legacy_insights(uuid) from public, anon;
grant execute on function public.capisol_office_legacy_insights(uuid) to authenticated;
