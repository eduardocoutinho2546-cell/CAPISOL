# CAPISOL — Auditoria operacional de segunda-feira, 26/10/2026

**Escopo:** empresa CAPISOL Energia Solar (não a revenda SaaS), sem implantar automação autônoma.
**Método:** GitHub main, GitHub Actions, SQL de leitura do Supabase, teste transacional com rollback e verificação pública de prestadores AC/RO.

## O que existe / o que de fato executa

| Frente | Evidência observada | Estado honesto | Falta |
| --- | --- | --- | --- |
| Site Escritório 4.0 e demo | GitHub Pages/CI verdes, fluxo visual com mock | Publicado; teste em browser de CI | Conferir login e processo com usuário real no navegador |
| Conta CAPISOL | 1 workspace, 1 membro no escritório | Ativa; gestão não está adotada pela equipe | Cadastrar perfis de sócios/marketing/ADM com contas confirmadas |
| CRM legado | public.docs possui 70.958 registros; 67.434 são base_rf, não leads | Base existente | Diagnosticar e reconciliar CRM legado com módulo novo, sem duplicar |
| Leads | 1.263 leads; 1.257 triagens; 108 sem fone, 53 sem origem, 1.263 sem campo vendedor, mas 1.013 com campo agente preenchido; 1.197 na etapa A contatar | Dados, não funil em uso pleno | Qualificação humana, responsável, próxima ação, consentimento e deduplicação |
| Comercial do escritório | 0 propostas novas / 0 tarefas | Interface existe mas não adotada | Registrar pelo menos uma jornada real autorizada |
| Fornecedores | 0 em capisol_suppliers; 17 **tipos de serviço** legados (todos AC), todos AGUARDANDO_COTACAO | Tabela sem fornecedores homologados | Classificar cotações e contratos/escopos com prestadores |
| Radar prestadores | 14 empresas candidatas AC/RO identificadas em fontes públicas e inseridas em capisol_partner_radar | Cadastros de candidatos, sem nenhum contato registrado ou contrato | Conferir telefones, serviço, NR-10/NR-35, ART, preço, distância, documentação e seguro |
| Radar concorrentes | 281 registros de concorrentes; 4 ofertas em coleção legada | Base registrada | Evidência datada, parâmetros comparáveis, decisão comercial com fonte |
| BelEnergy | Workflow agendado em 26/10 falhou na etapa **Confirmar pré-condições**, sem secrets configurados | **NÃO funcional para cotação automática** | Acesso legítimo BelEnergy, storage_state e workflow autorizados, secret do owner e teste real só com consentimento |
| Financeiro | 6 registros de contas a pagar somando R$ 1.780 com vencimento informado para 05/11/2026 (sem conciliação), 23 referências de preço (última atualização 16/10), 43 itens históricos de estoque; tabelas novas bancárias sem dados | Dado histórico parcial | Reconciliar contas, caixa 13 semanas, margem, pró-labore, notas e tributação com CFO e contador |
| Open Finance | 0 conexões/transações | Adapter do código, sem credenciais/consentimento | Homologar Pluggy e importação de 90 dias ou OFX com consentimento |
| Fiscal | 0 notas no escritório | Pré-validação técnica somente | Regime/CNAE e NFS-e nacional/muncipal confirmadas com contador e provedor |
| CAPISOL+ | 0 assinaturas no escritório | Modelo ainda não ativo em cobrança | Contrato, entregáveis, calendário, recorrência/cobrança, atendimento e garantias revisadas |
| WhatsApp | Edge functions whatsapp-enviar/webhook ativas, mas autorização/conexão efetiva do número não comprovada | Infraestrutura não significa canal produtivo | WABA próprio, templates, consentimento, status do provedor, end-to-end |
| Mídias | Posts-IA função implantada; novas tabelas de post sem trabalhos | Criação/rascunho; não publicação multi-rede | Conta oficial OAuth, origem autorizada, revisão e recibo |
| Segurança | RLS nas tabelas; correção da guarda NULL em capisol_stock_move e capisol_partner_review aplicada em 26/10 | Testes negativos SQL passaram | MFA, proteção contra senhas vazadas, revisão de SECURITY DEFINER, branch protection, backup RESTORE e credenciais |
| Multiempresa | Simulação cross-tenant comprovada em pontos específicos | **Não homologado globalmente** | 2 contas clientes reais, serviços de arquivo, relatórios, IA e logs isolados |

> 70.958 é total de registros `public.docs`, não 70.958 clientes; 67.434 pertencem ao acervo `base_rf`. As 17 entradas de `catalogo_parceiros` são **categorias/serviços** (solar/refrigeração/geradores/elétrica), não 17 prestadores com telefone verificado. Todos permanecem `AGUARDANDO_COTACAO`.

## Organização imediata — limite três prioridades ativas por pessoa
1. **Operação comercial real (direção comercial + atendimento):** confirmar contas da equipe; reconciliar 1.263 leads existentes por telefone/empresa, assinalar dono e próxima ação; testar pedido do WhatsApp até proposta e contrato. Não importar sem conferir duplicatas, LGPD e disponibilidade real.
2. **Financeiro e compra (CFO + contador):** reconciliar seis contas a pagar e custo real por kit, orçamento, comissão, imposto; validar tabela BelEnergy ao vivo com credenciais legítimas; não efetuar compra sem sinal/financiamento e aprovação.
3. **Prestadores e pós-venda (operação/engenharia):** 14 contatos candidatos, 17 categorias de serviço anteriores; verificar 3 perfis complementares por especialidade (instalador, manutenção/limpeza, elétrica/padrão); cadastro não é contrato. Ordem de serviço + fotos + aceite + garantia.

## Modelo do radar de prestadores
Tabelas: `capisol_partner_radar`, `capisol_partner_radar_reviews` com isolamento por workspace. Etapas:
`identificado → em_analise → contatado → documentos_pendentes` ou `descartado`. Sem o estado `parceiro_aprovado`; os 14 estão sem contratos e sem contatos realizados.

Campos: município/UF, categoria, serviços, telefone/e-mail comercial público, fonte URL, classificação como possível concorrente/fornecedor, data de fonte, etapa, última observação e histórico auditável de revisão.

A função privilegiada `capisol_partner_review` apenas muda etapa com motivo, não envia mensagens. Após teste negativo de cross-tenant, ela e `capisol_stock_move` tiveram guarda corrigida de `role NOT IN` para `coalesce(role,'') NOT IN`, pois SQL avalia `NULL NOT IN` como `NULL`, não como verdadeiro. Teste real com usuário sem vínculo negou ambas; tudo revertido.

## Candidatos principais com fontes primárias e diretórios
A fonte integral está em `data/radar-prestadores-ac-ro-20261026.json`. Exemplos:
- AC: D'Luz Engenharia — engenharia/termografia (https://www.dluzengenharia.com.br/); Elétrica Acre — eletricista (https://www.google.com/maps/search/?api=1&query=Eletrica+Acre+Rio+Branco); DuSol — concorrente/integrador, limpeza (https://www.solutudo.com.br/empresas/ac/rio-branco/limpeza%2Bde%2Bplacas%2Bsolares%2B-%2Bpaineis%2Bsolares).
- RO: Grupo Marok — materiais, engenharia e locação (https://marok.com.br/); Solar Eletricidade — elétrica rural/industrial (https://www.solareletricidade.com.br/a-empresa); Face Clean Tech — limpeza FV (https://br.todosnegocios.com/pt/face-clean-tech-limpeza-e-manuten%C3%A7%C3%A3o-de-69-99226-1778); JP Rebobinagem — motores/bombas (guia público); 364 Solar — Ji-Paraná (https://364solar.com.br/).

## Regra de homologação de um parceiro
1. Verificar CNPJ/regularidade, atividade, contato da empresa e área efetiva de cobertura.
2. Solicitar documentação e profissional habilitado: CREA/CFT/ART quando necessário, NR-10/NR-35 e seguro aplicável.
3. Conferir escopo e orçamento com preços de mão de obra, deslocamento, alimentação, EPI, material, prazo e retrabalho.
4. Firmar contrato/SLA com garantia, riscos, política de dados, fotos obrigatórias e não concorrência/confidencialidade quando negociados.
5. Testar primeira OS e aceite do cliente, com avaliação de qualidade, margem e pontualidade.
Só após esses cinco passos mudar cadastro operacional para prestador aprovado, em workflow ainda por homologar.

## O que NÃO fazer enquanto não existir evidência de produção
- Marcar os 14 como parceiros da CAPISOL, ligar um bot para todos ou importar contatos de terceiros sem base legal.
- Afirmar que BelEnergy funciona automaticamente: a execução agendada falhou por configuração ausente.
- Usar cotação de referência vencida, ou preço de R$ 18.500/18.900 como margem garantida sem kit, ISS, impostos, frete e comissões do momento.
- Faturar NFS-e em produção, transferir dinheiro ou conceder crédito pelo agente.
- Apresentar os 240 módulos de CAPISOL Gestão como totalmente ativos, ou o cenário de demonstração como transações reais.

## Critérios objetivos de funcionamento da CAPISOL (sem autonomia)
- Duas pessoas reais com acesso ao escritório e perfil conforme área.
- Um lead real consentido recebido → qualificado → visita → proposta parametrizada → negociação → contrato e recebimento confirmado.
- Uma cotação REAL do fornecedor com validade, número, preço e frete; preço revisado e aprovações registradas.
- Uma OS real gerada, prestador homologado, checklists, fotos, aceite e pós-venda.
- Caixa e obrigações documentadas com contador; não prometer emissão fiscal sem homologação.
- Relatórios de vendas, caixa, qualidade, prestadores e riscos exibindo fontes e últimos horários de atualização.
- Rotina de testes CI, backup/restauração e acesso revogável.

**Status geral em 26/10/2026: operação tecnológica parcial; CAPISOL não comprovou ainda jornada real completa pelo Escritório 4.0.**

## Fontes históricas e próximos dados para conciliação
- Banco legado: 1.197 leads em `prospeccao / A contatar`, 13 em `Mensagem pronta`, 47 registros operacionais em `A fazer` e seis em `Concluído`; essas etapas não comprovam envio/consentimento ou conversão.
- 1.013 registros de lead com `agente` preenchido e **nenhum com `vendedor` preenchido**. Tratar agente como referência técnica, não atribuição humana comprovada.
- Seis compromissos "A pagar" totalizam R$ 1.780 com data 05/11/2026 na base legada. Confirmar validade, beneficiário, status e documento com o CFO antes de liquidar.
- A coleta de concorrentes tem 281 cadastros (última alteração 22/10) e quatro ofertas cadastradas, sem observação preenchida no campo consultado. Não afirmar ROAS ou conversão de anúncios.
- O conjunto de 23 preços do legado tem última alteração em 16/10/2026 e não pode substituir cotação do fornecedor válida hoje.
