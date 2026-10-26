# Roteiro de apresentação CAPISOL Gestão 4.0 — 26/10/2026

**Objetivo**: demonstrar o produto com clareza nesta semana sem prometer funcionalidades externas não homologadas.

## Link da sala demonstrativa
https://eduardocoutinho2546-cell.github.io/CAPISOL/saas/demo.html

**Esta sala é PUBLICAMENTE ACESSÍVEL e inteiramente fictícia.** Sem login, sem banco de dados, sem integração com o CRM, sem chamadas externas; cada recarga restaura valores iniciais, e a opção imprimir permite levar resumo da apresentação.

## Demonstração em 5 etapas

1. **Visão executiva** — escolha "Produção rural"; explique que o catálogo abrange 240 capacidades especificadas em 24 núcleos. Mostre saldo de exemplo e uma unidade fictícia.
2. **Operação do segmento** — avance cultura do milho de plantado para crescimento, retire 3 unidades de fertilizante. Explique bloqueio de estoque negativo e a diferença entre simulação de cultivo e laudo de agrônomo.
3. **Troque para Oficina mecânica** — mostre peças e avance uma OS, sem executar cobrança nem reparo físico.
4. **Jornal / mídia e Igreja / associação** — demonstre a pauta avançando para revisão e aprovação de evento (nenhum post é enviado).
5. **Catálogo e escala** — pesquise por estoque, marketing, agronomia, jornalismo, contratos; selecione o nível "Global" e leia bloqueios de multimoeda, jurisdição, segurança e contingência. Imprima a tela de resumo para compartilhar.

## O que é comprovado hoje
- Banco Supabase ativo com autenticação e RLS, ainda com um único workspace real (CAPISOL).
- Oito tabelas de operação multissetorial com estrutura real de cadastro; estoque tem função transacional idempotente validada em sandbox SQL com rollback.
- Catálogo de 240 módulos identificados como **especificados**, 24 núcleos, dez escalas.
- Separação técnica do ambiente de demonstração, sem escrita externa; testada com navegador e testes Node na GitHub Actions.
- Memória IA ganhou separação por workspace em 26/10; a PR antiga do orquestrador **não** deve ser mesclada sem adaptar cliente para workspace_id.

## Não demonstrar como operacional de produção
- 240 módulos atuando automaticamente, IA conversando com os quatro provedores, boleto/NFS-e emitidos de verdade, Open Finance homologado ou depósito de pagamento.
- Fluxo de WhatsApp/Meta/TikTok/Youtube publicando sem confirmação de OAuth, consentimento, webhook e aprovação da plataforma.
- Cadastro rural e propriedades com documentos comprobatórios aprovados; diagnose de agrônomo veterinário sem profissional habilitado.
- Rotina multimoeda/global, infraestrutura SLA, 99,9% uptime ou dados operacionais de clientes reais.
- Acesso real de outras empresas sem aceite dos titulares e testes E2E.

## Checklist de aceitação de clientes reais
1. Primeiro cliente externo: conta confirmada, convite aceito, contrato/SaaS/LGPD e namespace sem dados CAPISOL.
2. Segundo cliente: tentativa de leitura/escrita cruzada no banco, mídia, documentos, relatórios e roteador IA sempre negada.
3. Provar backup e RESTORE, recuperar acesso/MFA e testar desligamento de um usuário.
4. Um fluxo completo de estoque/OS/nota/cobrança com fornecedores homologados e aprovação; agrônomo/jurídico/contador conforme ramo.
5. Postagem social somente pela conta verdadeira aprovada; rastreio e exclusão de conteúdo conforme regras da rede.
6. Revisar custos de tokens e licenças para SaaS comercial antes de disponibilização externa.

**Fase pós-apresentação:** habilitar automações reversíveis conforme aprovações e isolamento; decisão fiscal, financeira e regulada permanece com pessoa responsável.
