# CAPISOL — Status do CRM

## Diagnóstico em 24/10/2026

O CRM é um módulo integrado ao `index.html`, com armazenamento e sincronização Supabase já previstos no código. O status abaixo distingue presença de interface de integração operacional comprovada; não foram inventados registros atuais de clientes ou leads.

## O que existe no código

- Coleção operacional: `leads`
- Coleção operacional: `clientes`
- Coleção operacional: `propostas`
- Coleção operacional: `contratos`
- Coleção operacional: `agenda`
- Coleção operacional: `visitas`
- Coleção operacional: `obras`
- Coleção operacional: `posvenda`
- Coleção operacional: `recebimentos`
- Coleção operacional: `custos`
- Coleção operacional: `estoque`
- Coleção operacional: `equipe`
- Coleção operacional: `documentos`
- Coleção operacional: `precos`
- Coleção operacional: `arquivos`
- Coleção operacional: `modelos`
- Coleção operacional: `localidades`
- Coleção operacional: `assinaturas`
- Coleção operacional: `comissoes`
- Coleção operacional: `juridico`
- Coleção operacional: `fechamentos`
- Coleção operacional: `acessos`
- Coleção operacional: `os`
- Coleção operacional: `ajustes`
- Coleção operacional: `viagens`
- Coleção operacional: `romaneio`
- Coleção operacional: `movest`
- Coleção operacional: `campanhas`
- Coleção operacional: `mktcal`
- Coleção operacional: `promos`
- Coleção operacional: `concorrentes`
- Coleção operacional: `ideias`
- Coleção operacional: `incentivos`
- Coleção operacional: `competencias`
- Coleção operacional: `catalogo`
- Coleção operacional: `compras`
- Coleção operacional: `pagar`
- Coleção operacional: `descontos`
- Coleção operacional: `exclusoes`
- Coleção operacional: `rede`
- Coleção operacional: `posjornada`
- Coleção operacional: `agentes`
- Coleção operacional: `parceiros`
- Coleção operacional: `cotacoes`
- Coleção operacional: `concorrentes_cad`
- Coleção operacional: `atividade`
- Coleção operacional: `posts`

## Telas/funções encontradas

- `pgFunil` — presente
- `pgClientes` — presente
- `pgContratos` — presente
- `pgPosvenda` — presente
- `pgAtendimento` — presente
- `pgIndicadores` — presente
- `pgVendedor` — presente
- `pgPosts` — presente

## Estado operacional

- **Funil e follow-up:** implementados como fluxo e coleções; precisam de rotina diária para garantir próxima ação em todo lead.
- **Clientes, propostas e contratos:** implementados; precisam de validação de dados obrigatórios e vínculo consistente entre lead → proposta → contrato.
- **Descontos e margem:** implementados com alçada acima de R$ 500 e escalonamento; devem ser tratados como gate antes do aceite.
- **Atendimento e pós-venda:** telas e coleções presentes; integração de envio externo não deve ser presumida sem recibo da API oficial.
- **Campanhas e posts:** coleções e tela de posts presentes; publicação deve permanecer como rascunho até conta, permissão, opt-in e confirmação do provedor.
- **Indicadores:** módulo presente com metas configuráveis, kWh vendidos e visão de vendas; o plano Acre adiciona um painel estruturado de funil, caixa, margem, rota e recorrência.
- **CRM atual:** tecnicamente amplo, mas a maturidade operacional é **parcial** até que cada registro tenha dono, próxima ação, origem, consentimento quando aplicável, estágio e data de atualização.

## Prioridades de correção

1. Tornar `próxima ação`, `dono`, `origem`, `estágio` e `data` obrigatórios para lead e proposta.
2. Criar alerta diário para lead sem próxima ação e proposta vencida.
3. Ligar todos os KPIs do plano Acre ao funil e ao caixa real, não a números digitados manualmente.
4. Separar demo/localStorage de produção/Supabase e validar RLS antes de dados reais.
5. Fechar a integração oficial de WhatsApp, redes e fornecedor somente com credenciais novas e permissões mínimas.
