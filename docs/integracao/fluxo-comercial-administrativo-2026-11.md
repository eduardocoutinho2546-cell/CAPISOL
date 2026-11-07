# CAPISOL Gestão — passagem Comercial → Administrativo (piloto)

Inspeção: 07/11/2026. A finalidade é habilitar um primeiro elo rastreável, sem alterar pagamentos, contratos assinados, comissões ou compras.

## Evidência no banco (consulta de leitura)
- Supabase capisol-gestao: ACTIVE_HEALTHY.
- Coleção docs/leads: 1.210 cartões de prospecção, 118 operacionais, 0 no funil venda.
- Coleções docs/propostas, clientes, recebimentos, obras e vendas_sistemas_registro: 0 no momento consultado.
- capisol_proposals: 0; capisol_work_orders: 0; capisol_tasks: 5; capisol_agent_runs: 0.
- Sem vendas reais cadastradas, a operação ponta a ponta NÃO foi homologada.

## O que esta implementação faz
1. Painel na Central Comercial, dentro da área autenticada e autorizado por eh_membro().
2. Consulta contagens reais e as últimas 50 vendas manuais.
3. Somente venda confirmada (statusComercial vendida e conferido true) admite passagem ao administrativo.
4. Apenas um sócio com eh_dono() vê Encaminhar ao ADM e confirma o clique.
5. Cria cartão administrativo em docs/leads (funil operacional, etapa A fazer, refVenda) com ID determinístico ADM_<id-venda>, sem lançamentos financeiros.
6. Novas tentativas checam o mesmo ID, não criam cartões duplicados.
7. Não emite contrato, não confirma recebimento e não autoriza compra, comissão, instalação ou disparos externos.

## Condições de aceite e limitações
- [x] Implementação preparada na branch (sem merge).
- [x] Quatro testes unitários locais com dados sintéticos passaram.
- [ ] Teste do CI da PR confirmado verde.
- [ ] Merge/publicação por sócio.
- [ ] Smoke test autenticado com conta de sócio, inclusive negação para usuário sem permissão.
- [ ] Um registro de venda REAL percorreu venda → cartão ADM → conferência humana.
- [ ] Proposta, contrato, financiamento, financeiro, instalação, homologação e pós-venda conectados ponta a ponta.
- [ ] Conferência de RLS/workspace para SaaS multiempresa.

**Não cadastrar contratos, clientes ou receitas fictícias em produção.** Fazer testes funcionais apenas com venda verdadeira autorizada.

## Regras comerciais a conciliar antes de alterar comissões
O cérebro v10.2 documenta 3/4/5% com mudança a 5% a partir de R$ 300 mil; a política recém-proposta pelos sócios altera para 3% até R$ 200 mil, 4% até R$ 400 mil e 5% acima de R$ 400 mil. Nenhum motor financeiro foi alterado nesta entrega. Validar também base de cálculo e dedução de 8,5% com contador.

## Próxima etapa
Validar sessão e isolamento RLS, e criar a segunda passagem: cartão administrativo revisado → documentação de contrato → preparação da ordem de serviço, com aprovações humanas e trilha de auditoria.
