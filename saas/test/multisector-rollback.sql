-- Apenas teste transacional. NAO grava dados reais.
begin;
do $$
declare w uuid;actor uuid;u uuid;i uuid;req uuid:=gen_random_uuid();v numeric;different uuid;u2 uuid;
begin
 select workspace_id,user_id into w,actor from public.capisol_workspace_members
 where role='admin' and active limit 1;
 if w is null or actor is null then raise exception 'fixture_admin_missing';end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 insert into public.capisol_org_units(workspace_id,name,unit_type) values(w,'Unidade sintética de validação','warehouse') returning id into u;
 insert into public.capisol_stock_items(workspace_id,org_unit_id,sku,name)
 values(w,u,'SYN-001','Peça sintética para teste') returning id into i;
 v=public.capisol_stock_move(w,i,req,'in',20,'Entrada sintética');
 if v<>20 then raise exception 'wrong_balance_after_in';end if;
 v=public.capisol_stock_move(w,i,req,'in',20,'Entrada sintética');
 if v<>20 then raise exception 'not_idempotent';end if;
 if (select count(*) from public.capisol_stock_moves where workspace_id=w and stock_item_id=i)<>1 then raise exception 'duplicated_movement';end if;
 begin
  perform public.capisol_stock_move(w,i,req,'in',30,'Outra entrada');
  raise exception 'expected_id_conflict_not_raised';
 exception when others then
  if sqlerrm <> 'request_id_conflict' then raise;end if;
 end;
 begin
  perform public.capisol_stock_move(w,i,gen_random_uuid(),'out',21,'Retirada sintética');
  raise exception 'expected_negative_stock_rejection';
 exception when others then
  if sqlerrm <> 'insufficient_stock' then raise;end if;
 end;
 v=public.capisol_stock_move(w,i,gen_random_uuid(),'out',9,'Retirada sintética');
 if v<>11 then raise exception 'wrong_balance_after_out';end if;
 insert into public.capisol_workspaces(name,industry_code) values('Outra Empresa Sintética','services') returning id into different;
 insert into public.capisol_org_units(workspace_id,name,unit_type) values(different,'Filial sintética externa','branch') returning id into u2;
 begin
  insert into public.capisol_stock_items(workspace_id,org_unit_id,sku,name)values(w,u2,'BAD-SYN','SKU de outro cliente');
  raise exception 'expected_cross_tenant_fk_error';
 exception when foreign_key_violation then null;
 end;
end $$;
select 'stock_idempotency_tenant_fk_ok_rolled_back' as result;
rollback;
