-- Reparação: solução principal já implantada usa capisol_proposals.lead_ref,
-- capisol_check_proposal_lead e capisol_attribution_summary.
-- Elimina camada experimental duplicada somente se comprovadamente sem dados.
do $$
begin
 if to_regclass('public.capisol_atribuicao_propostas') is not null
    and exists (select 1 from public.capisol_atribuicao_propostas)
 then raise exception 'ATRIBUICAO_EXPERIMENTAL_COM_DADOS_NAO_DESCARTAR'; end if;
end $$;
drop function if exists public.capisol_funil_campanhas(uuid);
drop table if exists public.capisol_atribuicao_propostas;
-- Não afetar proposta real nem lead_ref.
