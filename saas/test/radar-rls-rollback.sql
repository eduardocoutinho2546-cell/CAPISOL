-- Teste isolado de revisão e proteção de estoque, sem deixar registros.
begin;
do $$ declare cap uuid;actor uuid;other uuid;rid uuid;sku uuid;unitid uuid;begin
 select workspace_id,user_id into cap,actor from public.capisol_workspace_members where active and role='admin' limit 1;
 select id into rid from public.capisol_partner_radar where workspace_id=cap limit 1;
 if rid is null then raise exception 'radar_sem_candidatos';end if;
 insert into public.capisol_workspaces(name,industry_code) values('Empresa sintética isolada','services') returning id into other;
 insert into public.capisol_org_units(workspace_id,name,unit_type) values(other,'Estoque de teste','warehouse') returning id into unitid;
 insert into public.capisol_stock_items(workspace_id,org_unit_id,sku,name) values(other,unitid,'TEST-ONLY','Item teste') returning id into sku;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 perform set_config('app.test_cap',cap::text,true);perform set_config('app.test_other',other::text,true);
 perform set_config('app.test_candidate',rid::text,true);perform set_config('app.test_sku',sku::text,true);
end $$;
set local role authenticated;
do $$ declare cap uuid;other uuid;rid uuid;sku uuid; s text;begin
 cap=current_setting('app.test_cap')::uuid;other=current_setting('app.test_other')::uuid;
 rid=current_setting('app.test_candidate')::uuid;sku=current_setting('app.test_sku')::uuid;
 s=public.capisol_partner_review(cap,rid,'em_analise','Teste sintético de revisão e histórico');
 if s<>'em_analise' then raise exception 'review_failed';end if;
 if (select count(*) from public.capisol_partner_radar_reviews where workspace_id=cap and candidate_id=rid)<>1 then raise exception 'missing_audit';end if;
 begin
  perform public.capisol_partner_review(other,rid,'contatado','Tentativa indevida de revisão estrangeira');
  raise exception 'cross_review_allowed';
 exception when others then if sqlerrm<>'manager_required' then raise;end if;
 end;
 begin
  perform public.capisol_stock_move(other,sku,gen_random_uuid(),'in',5,'Tentativa de estoque estrangeiro');
  raise exception 'cross_stock_allowed';
 exception when others then if sqlerrm<>'manager_required' then raise;end if;
 end;
end $$;
rollback;
