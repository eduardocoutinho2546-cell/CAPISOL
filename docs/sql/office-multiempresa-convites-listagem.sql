begin;
create function public.capisol_my_pending_workspace_invites()
returns table(invitation_id uuid, workspace_name text, industry_code text, workspace_kind text, expires_at timestamptz)
language sql stable security definer set search_path='' as $$
 select inv.id,w.name,w.industry_code,w.kind,inv.expires_at
 from public.capisol_tenant_invitations inv
 join public.capisol_workspaces w on w.id=inv.workspace_id
 where inv.invitee_user_id=(select auth.uid())
   and inv.status='pending' and inv.expires_at>now()
 order by inv.created_at desc
$$;
revoke all on function public.capisol_my_pending_workspace_invites() from public,anon;
grant execute on function public.capisol_my_pending_workspace_invites() to authenticated;
commit;
