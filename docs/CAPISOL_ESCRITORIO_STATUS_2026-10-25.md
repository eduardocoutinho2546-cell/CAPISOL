# Escritório CAPISOL — entrega e limites verificados

Data: 25/10/2026, Acre. Esta entrega amplia a gestão existente; não certifica a empresa como 100% automatizada.

## Implementado

- Novo escritório em `/saas/`, com a mesma autenticação Supabase da gestão.
- Tarefas dos 72 setores: objetivo, responsável, prazo, prioridade, evidência e estado. Até três tarefas ativas por pessoa; concluir exige evidência.
- 72 procedimentos distintos em `biblioteca/setores-operacionais.json`. Cada um define entradas, etapas, indicador, saída e revisão. São procedimentos assistidos, não 72 trabalhadores autônomos em execução permanente.
- Análise opcional por IA, com rascunho persistido e limite transacional de 30 chamadas por empresa/dia. Não inicia sem chave e modelo configurados.
- Fornecedores, propostas, assinaturas CAPISOL+ e rascunhos fiscais persistidos. Assinatura cadastrada não dispara cobrança.
- Painel de qualidade e crescimento consultando o histórico real `public.docs`, sem copiar cadastros. Acesso exige vínculo de gestor e acesso total à gestão anterior. Contagens históricas não são faturamento nem conversão mensal.
- Núcleo de dados separado por empresa, membros com perfis e revogação, auditoria gerada por triggers. Operadores só acessam suas tarefas; finanças ficam com gestores/sócios.
- Pluggy: backend para token, vínculo verificado por `clientUserId`, importação manual dos últimos 90 dias de transações efetivadas de contas bancárias e revogação. Sem pagamentos/transferências. Cartões e conciliação automática não foram implementados. Importações grandes podem ficar parciais, com estado explícito.
- Focus NFe: NFS-e Nacional, referência única por documento, envio protegido contra repetição, consulta de estado e links de documentos quando retornados pelo provedor. Um resultado incerto bloqueia reenvio automático. Não inclui NF-e de mercadorias, cancelamento ou substituição fiscal.
- API `capisol-cotacoes` corrigida: corpo do pedido é validado antes de avaliar a ação de funcionário. Permissões `DELETE`, `TRUNCATE`, `REFERENCES` e `TRIGGER` de cotações removidas do papel cliente.
- Fila do gateway protegida contra gravações concorrentes e execução duplicada; `accepted`, `running` e `uncertain` não são reenviados automaticamente. O gateway de arquivo exige operação em host único e inspeção manual de lock após queda.
- Recuperação das alterações úteis do HTML enviado: meta de sistemas configurável e correção de `nPiso` indefinido. O menor preço continua cobrindo custos estimados; prejuízo requer revisão dos sócios. Slogan, Instagram e contato público corrigidos.

## Verificação realizada

- Testes de unidade/regressão de fila, consentimento comercial, 72 setores, métricas, pré-validação fiscal, sintaxe do HTML e cálculo de metas/preços.
- Testes SQL no Supabase, com fixtures integralmente revertidas: isolamento entre empresas, tarefas próprias, restrições financeiras, negação anônima, impedimento de forjar nota autorizada/conexão bancária, auditoria imutável, limite de três prioridades e revogação de acesso.
- Teste Chromium de login, criação/edição de tarefa, evidência obrigatória, 72 setores, transformação de revisão em tarefa e navegação. Interface conferida em 390 px e 1440 px. Rede simulada nesse teste; permissões reais testadas separadamente no banco.
- Healthcheck real: `https://wvgmabqecrlydsranknn.supabase.co/functions/v1/capisol-office/health`.
- Endpoint de negócio sem sessão retorna `session_required`. Todos os POSTs validam a sessão via `auth.getUser` e a função de acesso por empresa. Verificação JWT do gateway desabilitada apenas nessa nova função porque a autenticação é executada no corpo; healthcheck público expõe somente presença de configuração, nunca valores de segredo.

## Bloqueios reais, sem simular conclusão

O healthcheck retornou **false** para Pluggy, Focus homologação, Focus produção e IA configurada. Não houve conexão com banco, emissão de nota, cobrança, compra ou chamada paga de modelo nesta entrega.

| Ativação | Dependência |
|---|---|
| Open Finance | Conta/contrato Pluggy, `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` no cofre do Supabase; consentimento bancário pelo titular; validar sandbox e produção |
| NFS-e teste | Empresa cadastrada na Focus, `FOCUS_NFE_HOMOLOG_TOKEN`, payload e certificado/configuração exigidos pelo provedor |
| NFS-e real | `FOCUS_NFE_PRODUCTION_TOKEN`, `FOCUS_CNPJ`, `FOCUS_FISCAL_VALIDATED=true` somente após validação do contador e teste autorizado; município, regime, códigos, série/numeração e retenções corretos |
| IA de setores | `ANTHROPIC_API_KEY` e `MODELO_IA` válidos; homologar uma análise e conferir custos/qualidade antes de rotina contínua |
| Segundo sócio | Conta própria com e-mail confirmado e vínculo administrativo verificado; não criar conta compartilhada nem elevar automaticamente outra pessoa |
| Cobrança SaaS/recorrência | Provedor de pagamentos, contrato e homologação; controle de assinaturas existe, cobrança automática não |
| Operação 24 horas | Worker/scheduler monitorado, limites, alertas, retenção e recuperação testados; os 191 perfis anteriores não comprovam execução contínua |

Cadastrar segredos somente no painel seguro do provedor. Não inserir tokens em HTML, GitHub, campos de cadastro nem no chat.

## Limites da gestão anterior

O módulo novo usa isolamento por empresa. O CRM anterior continua no modelo `docs`, com suas regras legadas; ele não foi convertido integralmente em SaaS multiempresa. Ocultar custos na interface antiga não equivale a segregação de campos no banco. Uma migração completa exige separar parâmetros públicos de preço e custos privados, testar todos os perfis e validar o histórico, sem interromper a operação.

Permanecem os módulos demonstrativos de tokens/mineração e limitações anteriores de integrações sociais, cotação automática BelEnergy e infraestrutura do gateway. O gateway local não foi hospedado como serviço permanente. O app principal continua monolítico; a auditoria sinaliza tamanho e uso legado de armazenamento local.

## Instalação e recuperação

Migrações já aplicadas no projeto `capisol-gestao`, nesta ordem:

1. `capisol_office_foundation` — `docs/sql/office-foundation.sql`
2. `capisol_office_agent_runs` — `docs/sql/office-agent-runs.sql`
3. `capisol_office_workflow_guards` — `docs/sql/office-workflow-guards.sql`
4. `capisol_office_membership_revocation` — `docs/sql/office-membership-revocation.sql`
5. `capisol_office_legacy_insights` — `docs/sql/office-legacy-insights.sql`

Não reaplicar os arquivos iniciais indiscriminadamente. São DDLs aditivos, sem remoção dos dados anteriores. Em caso de regressão da interface, reverter o commit do frontend mantendo os novos dados; não apagar tabelas para desfazer publicação. A versão anterior de `capisol-cotacoes` tinha a falha de ordem de leitura descrita acima.

Executar verificações locais:

```sh
node tools/audit-capisol.mjs
node tools/audit-production.mjs
node --test gateway/test/*.test.mjs saas/test/*.test.mjs
# Com Playwright e Chromium instalados:
node tools/test-office-ui.mjs
```

`saas/test/rls-rollback.sql` deve ser executado por administrador em ambiente autorizado; usa transação com rollback e contas sintéticas, sem enviar e-mails.

## Documentação oficial usada

- Pluggy autenticação: https://docs.pluggy.ai/en/docs/connect-widget/authentication
- Pluggy widget: https://docs.pluggy.ai/en/docs/connect-widget/introduction
- Pluggy vínculo de cliente: https://docs.pluggy.ai/en/reference/authentication
- Pluggy transações: https://docs.pluggy.ai/en/docs/products/transactions
- Focus NFS-e Nacional: https://doc.focusnfe.com.br/reference/emitir_dps_nacional
- Focus autenticação: https://doc.focusnfe.com.br/reference/autenticacao

A conclusão de homologação externa deve ser registrada com resultado real, referência do provedor e responsável, e não apenas com presença de credenciais.
