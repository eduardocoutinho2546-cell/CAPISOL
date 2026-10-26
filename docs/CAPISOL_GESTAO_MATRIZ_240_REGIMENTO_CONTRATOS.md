# CAPISOL Gestão 4.0 — matriz de 240 módulos, operações por ramo e escala

**Estado auditado**: 25/10/2026 — não confundir **cadastro de competência** com **rotina instalada, integrada, testada e homologada**.
**Produto**: mesmo SaaS e banco Supabase, segregado por `workspace_id`; contrato e normas de cada cliente são distintos.

## O que já foi criado
- `saas/module-registry.mjs`: **24 núcleos × 10 módulos = 240 capacidades especificadas**, papéis profissionais, risco, aplicabilidade e evidências obrigatórias.
- `saas/verticals.mjs`: segmentos adicionais de mecânica, comunicação/jornalismo, igrejas e terceiro setor, alimentação, cooperativas e profissionais; preserva perfis anteriores.
- `docs/sql/office-multiempresa-setores-extra.sql`: ampliação da lista de setores admitidos em convites (sem clientes criados).
- `docs/sql/office-modulos-multissetor-operacionais.sql`: 8 tabelas específicas para filiais, estoque, movimentação, cultivo, observações, OS, redação e eventos, todas com RLS.
- `saas/test/multisector-rollback.sql`: testes reais transacionais do motor de estoque, idempotência, saldo negativo e tentativa de associação entre tenants, com rollback.
- `saas/repository-candidates.json`: 22 repositórios reais verificados via API GitHub, sem instalação nem habilitação para produção.
- `saas/app.mjs`: explorador de módulos (com status transparente e filtros) e primeira bancada de cadastro/lançamento administrativo.

**Status real:** catálogo de especificações + **motor de estoque funcional e testado em transação com rollback** + cadastro inicial dos demais fluxos. A interface precisa ser revisada com contas reais e a CI da PR; cadastros não equivalem a execução autônoma de compras, colheitas, reparos ou matérias jornalísticas.

## Ramos e especialistas
| Ramo | Núcleo da execução | Profissionais e controles |
|---|---|---|
| Agro — culturas | Safra, talhão, culturas, plantio, estágio fenológico, colheita, custos | Engenheiro agrônomo e técnico agrícola; recomendação de defensivos/diagnóstico nunca só por IA |
| Agro — pecuária | Lotes, sanidade, vacinação, rastreabilidade e manejo | Zootecnista e médico veterinário; não prescrever sem profissional |
| Cooperativa | Grãos, armazenagem, classificação, vendas coletivas, rateios | Diretoria, contador e responsável técnico |
| Mecânica/oficinas | Entrada, diagnóstico, orçamento, OS, peças, manutenção, garantia | Mecânico habilitado, recepcionista técnico e gestor |
| Varejo/lojas | Estoque, PDV, troca, fidelidade, compras, e-commerce | Operador de caixa, comprador e contador fiscal |
| Jornais | Pauta, fontes, checagem, edição, correção, newsletters | Jornalista, editor responsável, jurídico da publicação |
| Igrejas e terceiro setor | Eventos, escalas, doações, prestação de contas e inventário | Administração, tesoureiro e responsável pela proteção de dados |
| Gastronomia/hotelaria | Fichas técnicas, perecíveis, perdas, reservas e ocupação | Responsável sanitário, cozinha e recepção |
| Saúde/educação | Calendários, controle administrativo, atendimentos e registros específicos | Diretores técnicos e profissionais credenciados; dados de saúde/menores segregados |
| Construção/logística | Custos, cronogramas, estoque, frota, qualidade e entregas | Engenheiro habilitado, segurança e gerente logístico |

### Áreas com riscos especiais
- **Igrejas:** filiação e convicção religiosa são dados pessoais sensíveis. Eventos comunitários não devem armazenar automaticamente a lista de fiéis: https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes.
- **Agro:** o CAR cadastrado não confirma aprovação ambiental nem titularidade; CCIR é documento cadastral, não certificado de propriedade: https://www.gov.br/car/pt-br/canais_atendimento/perguntas-frequentes/inscricao-no-car e https://www.gov.br/incra/pt-br/assuntos/governanca-fundiaria/cadastro-imovel-rural.
- **Saúde:** dados de prontuários exigem controles e bases legais específicos, não habilitados por simples módulo de catálogo.
- **Jornalismo:** checagem, atribuição de fontes, correções e aprovação editorial humana antes de publicar.

## Escala e alçadas
1. Bairro / comunidade: um gestor, uma unidade, controles locais básicos.
2. Município: prefeitura, particularidades de impostos e fornecedor local.
3. Cidade: regiões/bairros, várias equipes, agendamento e capacidade.
4. Cidade com filiais: estoque e caixa por filial, transferências auditadas, gestor por unidade.
5. Estado: tributos estaduais, consolidação e suporte distribuído.
6. Região (multiestadual): governança regional, padrões de execução e monitoramento.
7. Nacional: compliance, centros de custos nacionais, filiais em diferentes municípios/UFs.
8. Continental: moedas, língua, fusos e regulamentação de cada jurisdição.
9. Internacional: contratos transfronteiriços, alfândega, câmbio e privacidade.
10. Mundial/global: residência de dados por jurisdição, disponibilidade, restauração, políticas multilíngues, orçamento e controles regionais.

Uma mudança na escala NÃO cria filiais automaticamente nem declara conformidade local. `scaleCheck` informa lacunas de preparação.

## Regimento interno mínimo parametrizável (não substitui assessoria jurídica)
- **Autoridade:** definir proprietário, administrador de plataforma, sócios, gestores por filial, técnicos e terceirizados, sem conceder acesso cruzado entre clientes.
- **Alçadas:** aprovações escalonadas por valor, risco, contrato e país; alteração de preço ou condições comerciais exige trilha de auditoria.
- **Documentos:** registrar fonte, versão, editor, profissional revisor, validade, tempo de retenção e exclusão conforme regras locais.
- **Atendimento/WhatsApp:** contato em canal oficial, consentimento/base legítima, opt-out, limites de envio e logs; proibir disparos falsos e acesso não autorizado.
- **Estoque/compras:** cada saída exige documento e solicitação idempotente; compra externa necessita aprovador; jamais transferir saldo entre tenants.
- **Segurança:** autenticação individual, princípio de menor privilégio, segredos em cofre, MFA, revogação rápida e teste de backup/restauração.
- **IA:** recomendações e microtarefas classificadas por risco, quota de uso por tenant, referências verificáveis e revisão humana em áreas reguladas.
- **Fiscal/trabalhista:** contabilista habilitado responde pelo enquadramento; jurídico valida contratos, obrigações e vínculo.
- **Escalonamento:** fraude, vazamento, risco físico, conflito trabalhista, medicina, pesticidas, impostos e falha crítica são encaminhados à pessoa responsável.
- **Auditoria:** KPIs mensais por unidade; ação crítica com identidade, hora, antes/depois, autorização, evidência e reversão se possível.

## Pacote contratual necessário para o produto e para cada cliente
| Documento | Parte central | Estágio / validação |
|---|---|---|
| Contrato social e alterações | Razão social, sócios, quotas, administração, objeto/CNAE, endereço, capital | **Não gerado automaticamente**: depende do tipo societário, Junta Comercial, DREI e advogado/contador |
| Termos SaaS B2B | Licença de uso, disponibilidade, suspensão, suporte, limitação, propriedade intelectual, rescisão | Redação jurídica específica pendente |
| Tratamento de dados (DPA/LGPD) | Controlador/operador, finalidades, subprocessadores, transferências, retenção e incidente | Privacidade e jurídico pendentes |
| SLA de serviços | Resposta, incidentes, manutenção, janelas, créditos e métricas | Verificação de infraestrutura pendente |
| Política de segurança | Acesso, logs, backup, gestão de segredos e vulnerabilidades | Auditoria independente pendente |
| Contrato de parceiro/prestador | Entregas, documentação fiscal, segurança do trabalho e limites de acesso | Jurídico e RH pendentes |
| Termos de IA | Limites de autonomia, responsabilidade humana, fontes, modelos e taxas de uso | Homologação, revisão de provedores |
| Política de conteúdo/imagem | Direitos de videomaker, consentimento, licença, revisão e publicação | Ferramenta de coleta/assinatura pendente |

Para sociedade limitada, consultar o manual oficial de registro do DREI: https://www.gov.br/empresas-e-negocios/pt-br/drei/legislacao/instrucoes-normativas/arquivos-instrucoes-normativas-em-vigor/anexo-iv-limitada_compilada.pdf/@@download/file .

## Avaliação de ferramenta ou repositório antes de qualquer instalação
1. Problema comprovado que o motor interno ainda não resolve.
2. Repositório/mantenedor ativo, dependências, CVEs, licença do núcleo e plugins. GPL/AGPL têm obrigações que podem impactar integração e distribuição SaaS.
3. Custos completos de servidor, armazenamento, tráfego, atualização, equipe, segurança e suporte, não apenas “licença grátis”.
4. Ferramenta em ambiente isolado sem credenciais de produção, com rollback, documentação e logs.
5. Piloto com dados sintéticos; checagem de aderência brasileira e fluxo entre módulos.
6. Aprovação de dono de produto, segurança, contador/jurídico quando aplicável; integração ao SaaS só após testes E2E.

## Critérios para homologar 100% da plataforma
- Ingresso e suspensão/revogação de dois tenants reais, com falhas negadas em API/UI/backup/IA.
- Operação real e relatórios por filial com restauração de backup.
- Movimentação de estoque com concorrência real, sem dupla saída, saldo negativo, inconsistência ou vazamento de tenant.
- Planejamento de safra e registro de campo validados por agrônomo; licenças de mapas e dados externos verificadas.
- Oficina com entrada, peça, OS, orçamento aprovado, faturamento homologado e pós-venda completo.
- Jornal com pauta até publicação revisada, correção e prova de autoria/fonte.
- Igreja sem coleta excessiva de dados religiosos sensíveis e com trilha de prestação de contas.
- Fiscal, cobrança, bancos, WhatsApp, redes e documentos com conexões oficiais e autorizações.
- Teste de carga, monitoramento, recuperação, SLA e testes por escala geográfica/múltiplas moedas.
- **Somente depois** iniciar a automação autônoma graduada por nível de risco (etapa futura solicitada pelo usuário).
