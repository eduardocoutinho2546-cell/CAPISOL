begin;
create function public.capisol_office_legacy_insights(p_workspace uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare counts jsonb; quality jsonb; stages jsonb;
begin
 if public.capisol_workspace_role(p_workspace) not in ('admin','manager') or public.capisol_workspace_role(p_workspace) is null or not public.eh_total() then raise exception 'legacy_access_required'; end if;
 if not exists(select 1 from public.capisol_workspaces where id=p_workspace and cnpj='66360677000149') then raise exception 'legacy_workspace_mismatch'; end if;
 select coalesce(jsonb_object_agg(col,n),'{}'::jsonb) into counts from (select col,count(*) n from public.docs where col in ('leads','clientes','propostas','contratos','obras','os','assinaturas') group by col) x;
 select jsonb_build_object('leads_without_phone',count(*) filter(where col='leads' and length(regexp_replace(coalesce(data->>'fone',''),'[^0-9]','','g'))<10),'leads_without_source',count(*) filter(where col='leads' and trim(coalesce(data->>'origem',''))=''),'leads_without_owner',count(*) filter(where col='leads' and trim(coalesce(data->>'vendedor',''))=''),'accepted_proposals',count(*) filter(where col='propostas' and data->>'status'='Aceita'),'active_subscriptions_missing_price',count(*) filter(where col='assinaturas' and data->>'status'='Ativo' and coalesce(data->>'mensalidade','') in ('','0'))) into quality from public.docs where col in ('leads','propostas','assinaturas');
 select coalesce(jsonb_object_agg(stage,n),'{}'::jsonb) into stages from (select coalesce(nullif(data->>'etapa',''),'Sem etapa') stage,count(*) n from public.docs where col='leads' group by 1) x;
 return jsonb_build_object('source','public.docs','checked_at',now(),'counts',counts,'quality',quality,'lead_stages',stages,'scope','historical_all_records');
end $$;
revoke all on function public.capisol_office_legacy_insights(uuid) from public,anon;
grant execute on function public.capisol_office_legacy_insights(uuid) to authenticated;
commit;
