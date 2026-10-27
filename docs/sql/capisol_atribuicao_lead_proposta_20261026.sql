-- CAPISOL: atribuição rastreável entre pedido consentido, proposta e venda.
-- Não importa contatos públicos, não cria compras e não altera histórico.
ALTER TABLE public.capisol_proposals ADD COLUMN IF NOT EXISTS lead_ref text;
CREATE INDEX IF NOT EXISTS capisol_proposals_lead_ref_idx
  ON public.capisol_proposals(workspace_id,lead_ref) WHERE lead_ref IS NOT NULL;

CREATE OR REPLACE FUNCTION public.capisol_check_proposal_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $$
BEGIN
 IF NEW.lead_ref IS NULL OR btrim(NEW.lead_ref)='' THEN
  NEW.lead_ref=NULL;
  RETURN NEW;
 END IF;
 IF length(NEW.lead_ref)>64 OR NOT EXISTS (
  SELECT 1 FROM public.docs l
  WHERE l.col='leads' AND l.id=NEW.lead_ref
    AND ((l.data->>'origem'='Site' AND l.data->>'autContato'='true')
      OR (l.data->>'origem'='WhatsApp (API oficial)'
          AND l.data->>'consentimento'='iniciou a conversa'))
 ) THEN
  RAISE EXCEPTION 'LEAD_REFERENCIA_INVALIDA_OU_SEM_CONSENTIMENTO';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capisol_check_proposal_lead() FROM public,anon,authenticated;
DROP TRIGGER IF EXISTS capisol_proposals_lead_guard ON public.capisol_proposals;
CREATE TRIGGER capisol_proposals_lead_guard
BEFORE INSERT OR UPDATE OF lead_ref
ON public.capisol_proposals
FOR EACH ROW EXECUTE FUNCTION public.capisol_check_proposal_lead();

CREATE OR REPLACE FUNCTION public.capisol_attribution_summary(p_workspace uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path=''
AS $$
DECLARE
 v_campaigns jsonb := '[]'::jsonb;
 v_inbound integer := 0;
 v_linked integer := 0;
BEGIN
 IF (SELECT auth.uid()) IS NULL
    OR coalesce(public.capisol_workspace_role(p_workspace),'') NOT IN ('admin','manager')
    OR NOT public.eh_total()
    OR NOT EXISTS(SELECT 1 FROM public.capisol_workspaces
       WHERE id=p_workspace AND cnpj='66360677000149')
 THEN
  RAISE EXCEPTION 'ATTRIBUTION_ACCESS_DENIED';
 END IF;
 WITH leads AS (
   SELECT l.id,
     coalesce(nullif(l.data->>'utm_source',''),
      CASE WHEN l.data->>'origem'='Site' THEN 'site_direto'
           ELSE 'whatsapp_iniciado' END) source,
     coalesce(nullif(l.data->>'utm_campaign',''),nullif(l.data->>'utm_content',''),'(sem campanha)') campaign
   FROM public.docs l
   WHERE l.col='leads' AND
     ((l.data->>'origem'='Site' AND l.data->>'autContato'='true')
       OR (l.data->>'origem'='WhatsApp (API oficial)' AND l.data->>'consentimento'='iniciou a conversa'))
 ), total AS (
   SELECT count(*)::integer n FROM leads
 ), groups AS (
   SELECT l.source,l.campaign,count(DISTINCT l.id)::int as leads,
    count(p.id)::int as propostas,
    count(p.id) FILTER(WHERE p.status='won')::int as vendas,
    coalesce(sum(p.price) FILTER(WHERE p.status='won'),0)::numeric(14,2) as receita_ganha,
    coalesce(sum(p.price-p.estimated_cost) FILTER(WHERE p.status='won'),0)::numeric(14,2) as contribuicao_estimada
   FROM leads l LEFT JOIN public.capisol_proposals p
     ON p.lead_ref=l.id AND p.workspace_id=p_workspace
   GROUP BY l.source,l.campaign
 )
 SELECT (SELECT n FROM total),
        coalesce((SELECT sum(propostas)::int FROM groups),0),
        coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.leads DESC, x.source, x.campaign)
                  FROM (SELECT * FROM groups ORDER BY leads DESC, source, campaign LIMIT 30) x),'[]'::jsonb)
 INTO v_inbound,v_linked,v_campaigns;
 RETURN jsonb_build_object(
  'source','leads_consentidos_e_propostas_vinculadas',
  'scope','capisol_only',
  'inbound_total',coalesce(v_inbound,0),
  'linked_proposals',coalesce(v_linked,0),
  'campaigns',v_campaigns,
  'as_of',now(),
  'note','Receita apenas de propostas com status won; nao equivale a valor recebido em conta.'
 );
END $$;
REVOKE ALL ON FUNCTION public.capisol_attribution_summary(uuid) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.capisol_attribution_summary(uuid) TO authenticated;
