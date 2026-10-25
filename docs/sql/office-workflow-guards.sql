begin;
alter table public.capisol_tasks add constraint task_execution_requires_plan check(status not in ('active','review','done') or (assignee_id is not null and due_date is not null and length(trim(objective))>=5));
create function public.capisol_office_workflow_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_TABLE_NAME='capisol_tasks' then
  if new.status='active' and new.assignee_id is not null then
   perform pg_advisory_xact_lock(hashtextextended(new.workspace_id::text||new.assignee_id::text,0));
   if (select count(*) from public.capisol_tasks where workspace_id=new.workspace_id and assignee_id=new.assignee_id and status='active' and id<>new.id)>=3 then raise exception 'max_three_active_priorities'; end if;
  end if;
 elsif TG_TABLE_NAME='capisol_proposals' then
  if new.status in ('approved','won') and new.price<new.estimated_cost and current_user not in ('service_role','postgres') and public.capisol_workspace_role(new.workspace_id) is distinct from 'admin' then raise exception 'partner_review_required_for_loss'; end if;
 end if;
 return new;
end $$;
revoke all on function public.capisol_office_workflow_guard() from public,anon,authenticated;
create trigger task_workflow before insert or update on public.capisol_tasks for each row execute function public.capisol_office_workflow_guard();
create trigger proposal_workflow before insert or update on public.capisol_proposals for each row execute function public.capisol_office_workflow_guard();
commit;
