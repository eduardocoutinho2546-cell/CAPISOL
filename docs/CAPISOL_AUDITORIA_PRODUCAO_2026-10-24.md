# CAPISOL — Auditoria de produção

## Resultado executivo

A base atual é uma demo avançada e um CRM inicial, não ainda uma plataforma autônoma de produção. O catálogo contém 191 agentes, mas o front-end principal é um monólito HTML/JavaScript de aproximadamente 1,28 MB, sem manifesto de dependências ou build reproduzível. Há chamadas Supabase e armazenamento local misturados com fluxos de produção. Isso cria risco de travamento em celulares, perda de dados locais, dependência de CDN e falso sinal de integração.

## Falhas críticas corrigidas nesta rodada

- Biblioteca operacional gerada a partir das 72 categorias do anexo, preservando 2.338 funções.
- Helpers de runtime para timeout, retry, backoff, limite de payload, URL permitida e redação de segredos.
- Auditoria automática de peso, CDN sem SRI, rede sem AbortController, localStorage, segredos, rotas e sintaxe.
- Runbook explícito de backup, RPO/RTO, retenção, destino e teste de restauração.

## Riscos ainda bloqueantes para produção

| Risco | Evidência | Tratamento necessário |
|---|---|---|
| Monólito pesado | `index.html` ~1,28 MB | dividir em módulos e carregar por rota; medir LCP/JS em aparelho móvel |
| Requisições penduradas | fetch sem AbortController central | aplicar `withTimeout` e retry somente em operações idempotentes |
| CDN sem integridade | Supabase/jsPDF carregados externamente | empacotar, fixar versão e adicionar SRI/CSP |
| Dados locais | tokens, minerador e metas em localStorage | manter apenas demo; produção deve usar API/Supabase com RLS |
| Backup não comprovado | não há job de export/restore no repo | configurar destino, segredo no cofre e teste mensal |
| Integrações declaradas | BelEnergy, WhatsApp e redes dependem de credenciais | testar API oficial e guardar recibo/status; nunca simular conectado |
| GitHub bloqueado | token sem escopo de escrita e push 403 | renovar connector/token com `contents: write` |
| Dependência de Supabase | cliente público precisa de RLS correta | revisar advisors, policies e funções RPC no projeto real |

## Critério de pronto de produção

A CAPISOL só deve ser chamada de pronta quando: build reproduzível passar; nenhum bundle crítico exceder o orçamento definido; todas as requisições tiverem timeout; erros tiverem estado recuperável; RLS e RPC forem testados com usuário anônimo e autenticado; backup e restore tiverem evidência; integrações tiverem teste oficial; e o GitHub Actions estiver verde na branch publicada.

## Ferramentas avaliadas

- Supabase: base já utilizada; manter, mas endurecer RLS e migrations.
- LangGraph: adequado para agentes resilientes, porém não deve ser acoplado ao front estático sem backend.
- n8n: adequado para automações e integrações, sujeito a revisão de licença e hospedagem.
- Grafana: adequado para observabilidade; introduzir somente com fonte de métricas real.
- restic: adequado para backup criptografado e verificável.
- MinIO: não introduzir agora; o repositório avaliado está arquivado.
- Homepage: dashboard auxiliar, não substitui o CRM.

## Próxima sequência técnica

1. Separar o monólito por módulos e rotas.
2. Criar camada única de API com timeout, retry, idempotência e telemetria.
3. Criar migrations e testes de RLS.
4. Implementar backup e restore em ambiente separado.
5. Adicionar Playwright smoke tests mobile/desktop.
6. Só então conectar publicação oficial, WhatsApp, BelEnergy, banco e emissão fiscal.
