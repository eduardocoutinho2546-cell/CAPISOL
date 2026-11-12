-- Correção de segurança 26/10: NULL de papel NÃO autoriza SECURITY DEFINER.
begin;
create or replace function public.capisol_partner_review(
 p_workspace uuid,p_candidate uuid,p_stage text,p_reason text
) returns text language plpgsql security definer set search_path='' as $$
declare v_old text;
begin
 if coalesce(public.capisol_workspace_role(p_workspace),'') not in ('admin','manager') then raise exception 'manager_required';end if;
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

create or replace function public.capisol_stock_move(p_workspace uuid,p_item uuid,p_request uuid,p_type text,p_quantity numeric,p_reason text)
returns numeric language plpgsql security definer set search_path='' as $$
declare v_current numeric; v_previous public.capisol_stock_moves%rowtype;v_new numeric;
begin
 if coalesce(public.capisol_workspace_role(p_workspace),'') not in ('admin','manager') then raise exception 'manager_required';end if;
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

commit;
