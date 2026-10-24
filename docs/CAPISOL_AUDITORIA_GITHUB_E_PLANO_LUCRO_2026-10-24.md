# Capisol — Auditoria do repositório e plano de lucro

**Data:** 2026-10-24
**Escopo:** repositório `eduardocoutinho2546-cell/CAPISOL`, branches, módulos atuais e bibliotecas open source baixadas para avaliação.

## 1. Diagnóstico

A Capisol já possui uma base operacional relevante em HTML/JavaScript com Supabase:

- Gestão principal autenticada.
- CRM com leads, clientes, propostas, contratos, agenda, visitas, obras, pós-venda, recebimentos, custos, estoque, documentos, equipe e tabela de preços.
- Central comercial e inteligência.
- Simulador e geração de proposta/Word.
- Campo de geração mensal em kWh e geração anual calculada.
- Regras de margem, lucro-meta, lucro-piso, comissão, tributos e custos de deslocamento.
- Cotações de parceiros e módulo BelEnergy com leitura de PDF, hash SHA-256 e envio apenas de campos comerciais.
- Fila de cotação sem compra automática.
- Prospecção, triagem de concorrentes e confirmação de empresas.
- Calendário de marketing em modo rascunho.
- Mensagens preparadas para WhatsApp, sem disparo automático.
- Backup, auditoria, revisão independente, controle de acesso e referências a RLS/Supabase.
- Catálogo de agentes com 175 perfis na branch principal.
- Branches históricas com ideias e módulos adicionais; nenhuma branch antiga deve substituir a `main` sem revisão, porque várias removem arquivos e ativos que a `main` já contém.

## 2. Correção estratégica de território

### Acre

- Sede: Rio Branco.
- Atendimento local: Rio Branco e municípios em raio de até 90 km, com preço calculado por deslocamento.
- Negócios maiores fora do raio: aceitar seletivamente, com ticket, margem, agenda, risco e logística validados.

### Rondônia

- Núcleo inicial: Rolim de Moura.
- Atendimento de proximidade: municípios circunvizinhos de Rolim de Moura.
- Expansão posterior: lotes de visitas e parceiros locais, não deslocamentos isolados de baixa margem.

A política regional deve calcular preço recomendado por localidade. O agente não deve prometer atendimento só porque o lead está em AC ou RO.

## 3. Produto e unidade de valor

O carro-chefe é o sistema com **geração mensal prevista de 1.000 kWh/mês**. Isso precisa permanecer separado de:

- potência instalada em kWp;
- geração anual estimada;
- consumo mensal do cliente;
- tarifa e economia estimada;
- preço do sistema;
- custo do kit e margem da Capisol.

O sistema já contém campos para geração mensal e anual. O próximo controle é validar que proposta, relatório, CRM e agentes usam a mesma unidade e não confundem kWh/mês com kWp.

## 4. Prioridade de lucro

A ordem de execução recomendada é:

1. Melhorar conversão do kit de 1.000 kWh/mês.
2. Proteger margem por localidade.
3. Fechar o plano anual de limpeza, vistoria e inspeção.
4. Reativar clientes e leads já existentes.
5. Criar canais de parceiros e representantes.
6. Vender para grandes negócios somente quando ticket e logística compensarem.
7. Usar conteúdo, concorrência e anúncios como experimentos mensuráveis.
8. Só depois acelerar consórcio, seguro, usina, climatização e produto próprio.

## 5. Canais prioritários

### Canal 1 — Base existente

Clientes, leads antigos, pós-venda, técnicos, indicações e contatos já cadastrados. É o canal de menor custo e deve receber a primeira régua de limpeza/vistoria/plano anual.

### Canal 2 — Parceiros multiplicadores

Instaladores, eletricistas, engenheiros, arquitetos, lojas, administradores de condomínios e empresas que têm muitos clientes solares. O objetivo é um parceiro gerar múltiplas oportunidades, não apenas uma indicação isolada.

### Canal 3 — B2B local

Mercados, hotéis, clínicas, frigoríficos, indústrias, escolas, condomínios, propriedades rurais e empresas com alto custo de parada. A mensagem deve vender confiabilidade, diagnóstico e previsibilidade, sem prometer economia automática.

### Canal 4 — Busca local e prova

Site, Google Business Profile, avaliações, fotos autorizadas, casos reais e conteúdo educativo para Rio Branco, entorno e Rolim de Moura. O agente de SEO deve medir chamadas, mensagens e diagnósticos, não apenas alcance.

### Canal 5 — Conteúdo e vídeo

Roteiros curtos com problemas observáveis: sujeira, falhas de manutenção, inspeção, segurança, garantia, documentação e sinais de perda de desempenho. Publicação deve continuar em rascunho até revisão e consentimento.

### Canal 6 — Anúncios pagos

Só liberar após existir uma oferta validada, margem mínima, rastreamento de origem e capacidade de atendimento. Começar com orçamento pequeno e uma hipótese por campanha.

## 6. Análise de concorrentes

O sistema já possui `mercado`, `radar-concorrentes`, `pesquisador-mercado`, `monitor-fontes` e `confirmador-google`. O padrão correto é comparar apenas ofertas equivalentes:

- geração mensal ou potência equivalente;
- equipamento e escopo;
- instalação/projeto/homologação incluídos ou não;
- prazo;
- garantia e responsável;
- distância/logística;
- condições de pagamento;
- evidências públicas;
- pós-venda e manutenção.

Não registrar preço público como verdade final sem fonte, data e comparabilidade. A vantagem competitiva da Capisol pode ser construída em manutenção, documentação, atendimento regional e recorrência, não necessariamente em ser a mais barata.

## 7. Repositórios externos baixados para avaliação

| Repositório | Uso potencial | Decisão inicial |
|---|---|---|
| `langchain-ai/langgraph` | agentes com estado, persistência, retomada e human-in-the-loop | estudar para orquestração futura; não substituir o sistema atual agora |
| `n8n-io/n8n` | workflows, aprovações, integrações e observabilidade | candidato forte para automações externas; verificar licença Sustainable Use antes de distribuir como produto |
| `chatwoot/chatwoot` | inbox omnichannel, WhatsApp, Instagram, campanhas e relatórios de atendimento | candidato para atendimento; comparar com CRM/Supabase atual antes de duplicar dados |
| `nocodb/nocodb` | base operacional no-code, formulários, views e APIs | útil para protótipos internos; licença Sustainable Use exige revisão antes de incorporar |
| `metabase/metabase` | painéis, métricas, alertas e assinaturas executivas | candidato para BI; AGPL/comercial exige revisar modo de uso e hospedagem |

As cópias rasas estão em `/home/ubuntu/open-source/`. Nenhum código externo foi incorporado à Capisol ou colocado em produção automaticamente.

## 8. Lacunas funcionais para completar 190 papéis

O catálogo atual tem 175 agentes na main. Para chegar a 190 sem criar duplicidade, os 15 papéis adicionais recomendados são:

1. `lucro-diario` — consolida vendas, margem, caixa e decisões do dia.
2. `gestor-canais` — mede cada canal por oportunidade, venda, margem e custo.
3. `gerente-representantes` — onboarding, território, metas, comissão e qualidade da rede.
4. `contas-estrategicas` — grandes negócios fora do raio, ticket e logística.
5. `parcerias-multiplicadoras` — instaladores e empresas com carteira de clientes.
6. `produto-kit-1000` — dono do escopo, evidências, objeções e evolução do produto principal.
7. `plano-anual` — desenha e testa pacotes de limpeza, vistoria e inspeção.
8. `recuperacao-leads` — reativa leads sem resposta com cadência e motivo de perda.
9. `vendas-local-rio-branco` — prospecção e mensagem específica da sede e raio de 90 km.
10. `vendas-local-rolim` — prospecção e parcerias no núcleo de Rondônia.
11. `marketing-franquias` — testa canal de franqueadores/franqueados como multiplicador.
12. `experimentos-oferta` — testa preço, escopo, CTA e prova sem alterar produção silenciosamente.
13. `qualidade-dados-comercial` — verifica kWh/mês, kWp, origem, preço, custo, estágio e consentimento.
14. `avaliador-meritocracia` — pontua agentes por resultado, precisão, retrabalho e escalonamento correto.
15. `relatorio-diario-lucro` — entrega briefing diário de uma página e alimenta o painel executivo.

Esses nomes são cargos operacionais da Capisol, não cópias de pessoas reais. Os nomes reais listados pelo fundador podem servir como referências bibliográficas, metodológicas ou de análise pública, sempre com atribuição e sem fingir que a pessoa está participando da empresa.

## 9. Relatório diário obrigatório

O relatório interno deve ser produzido todos os dias com:

- saldo de caixa conhecido;
- entradas recebidas;
- recebimentos esperados em 7, 30 e 90 dias;
- propostas abertas e valor ponderado;
- margem estimada por proposta;
- leads sem próxima ação;
- vendas por canal e localidade;
- capacidade da operação;
- serviços atrasados;
- clientes elegíveis para plano anual;
- concorrentes ou mudanças de mercado relevantes;
- três decisões: aprovar, revisar ou bloquear;
- uma ação de lucro para o dia.

## 10. Próximo ciclo técnico

1. Criar os 15 perfis faltantes em formato versionado, sem ativar envio externo.
2. Atualizar o território de RO para Rolim de Moura e circunvizinhos.
3. Fixar “1.000 kWh/mês” como unidade de geração na oferta, mantendo kWp separado.
4. Criar painel de lucro por canal e localidade.
5. Criar pipeline de plano anual.
6. Criar scorecard de agentes.
7. Testar somente uma automação por vez.
8. Validar alterações com dados do Supabase e teste manual no navegador.

## 11. Limites

- Agentes não assinam como advogado, contador, engenheiro, corretor ou responsável técnico.
- Agentes não fazem compra, pagamento, contratação ou publicação externa sem alçada explícita.
- WhatsApp automático exige canal oficial, consentimento, templates aprovados e registro.
- Licenças de n8n, NocoDB e Metabase precisam ser revisadas antes de qualquer distribuição comercial ou incorporação de código.
- Nenhum concorrente deve ser copiado; a análise serve para posicionamento, preço comparável e oportunidade.
