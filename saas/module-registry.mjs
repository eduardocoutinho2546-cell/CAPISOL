// Catálogo de capacidades — especificação, não instalação ou autorização automática.
// Um único motor por competência; ramos e escalas ativam configurações e revisões próprias.
const families = [
 {
  "id": "governance",
  "name": "Governança e estratégia",
  "vertical": "all",
  "roles": [
   "Direção",
   "Conselho",
   "Controladoria"
  ],
  "names": [
   "Mapa de unidades",
   "Organograma e cargos",
   "Planejamento e OKRs",
   "Regimento interno",
   "Contrato social e alterações",
   "Matriz de alçadas",
   "Gestão de riscos",
   "Auditoria de decisões",
   "Continuidade e sucessão",
   "Relacionamento institucional"
  ]
 },
 {
  "id": "finance",
  "name": "Financeiro e controladoria",
  "vertical": "all",
  "roles": [
   "CFO",
   "Tesouraria",
   "Contador"
  ],
  "names": [
   "Fluxo de caixa diário",
   "Contas a pagar",
   "Contas a receber",
   "Conciliação bancária",
   "Tesouraria por filial",
   "Centros de custos",
   "Orçamento por unidade",
   "Projeção de caixa",
   "Margem por produto e serviço",
   "Planejamento de capital"
  ]
 },
 {
  "id": "tax",
  "name": "Fiscal e contábil",
  "vertical": "all",
  "roles": [
   "Contador",
   "Fiscal",
   "Auditoria"
  ],
  "names": [
   "NFS-e por município",
   "NF-e e NFC-e",
   "Escrituração contábil",
   "Classificação tributária",
   "SPED e obrigações",
   "Retenções e impostos",
   "Regimes tributários",
   "Conciliação fiscal",
   "Certidões e vencimentos",
   "Fechamento mensal"
  ]
 },
 {
  "id": "sales",
  "name": "Comercial e propostas",
  "vertical": "all",
  "roles": [
   "Diretor comercial",
   "Vendedor",
   "Pricing"
  ],
  "names": [
   "Prospecção autorizada",
   "Qualificação de leads",
   "Visitas e reuniões",
   "Propostas parametrizadas",
   "Precificação e desconto",
   "Funil por unidade",
   "Contratos comerciais",
   "Vendas recorrentes",
   "Comissões autorizadas",
   "Inteligência de concorrência"
  ]
 },
 {
  "id": "customer",
  "name": "Clientes e atendimento",
  "vertical": "all",
  "roles": [
   "Atendente",
   "Sucesso do cliente",
   "Ouvidoria"
  ],
  "names": [
   "Central de tickets",
   "WhatsApp oficial",
   "E-mail corporativo",
   "Chat de site",
   "Reclamações e SLA",
   "Pós-venda",
   "Pesquisa de satisfação",
   "Retenção e renovação",
   "Portal do cliente",
   "Base de dúvidas"
  ]
 },
 {
  "id": "marketing",
  "name": "Marketing e crescimento",
  "vertical": "all",
  "roles": [
   "Marketing",
   "Redator",
   "Analista de dados"
  ],
  "names": [
   "Campanhas e orçamento",
   "SEO e conteúdo",
   "Análise de aquisição",
   "Gestão de leads",
   "Biblioteca de ativos",
   "Produção audiovisual",
   "Calendário editorial",
   "Publicação oficial",
   "Analytics e atribuição",
   "Parcerias e imprensa"
  ]
 },
 {
  "id": "people",
  "name": "Pessoas e RH",
  "vertical": "all",
  "roles": [
   "RH",
   "Departamento pessoal",
   "Líder de equipe"
  ],
  "names": [
   "Cargos e competências",
   "Recrutamento",
   "Admissão e contratos",
   "Treinamento e onboarding",
   "Escalas e jornada",
   "Segurança do trabalho",
   "Desempenho e feedback",
   "Folha e encargos",
   "Gestão de terceiros",
   "Desligamento e acesso"
  ]
 },
 {
  "id": "documents",
  "name": "Documentos e conhecimento",
  "vertical": "all",
  "roles": [
   "Documentalista",
   "Jurídico",
   "Privacidade"
  ],
  "names": [
   "OCR e extração",
   "Gestão de contratos",
   "Assinaturas eletrônicas",
   "Arquivamento e retenção",
   "Busca corporativa",
   "Versionamento de normas",
   "Controle de consentimento",
   "Modelos de documentos",
   "Fluxos de aprovação",
   "Inventário de dados LGPD"
  ]
 },
 {
  "id": "inventory",
  "name": "Estoque e compras",
  "vertical": "all",
  "roles": [
   "Almoxarife",
   "Comprador",
   "Controladoria"
  ],
  "names": [
   "Cadastro de SKUs",
   "Estoque por unidade",
   "Movimentação e lotes",
   "Inventário cíclico",
   "Reposição e ponto de pedido",
   "Solicitação de compra",
   "Cotação de fornecedores",
   "Ordens de compra",
   "Rastreabilidade e validade",
   "Custos de armazenagem"
  ]
 },
 {
  "id": "field",
  "name": "Serviços e ordens de trabalho",
  "vertical": "all",
  "roles": [
   "Técnico",
   "Supervisor de campo",
   "Qualidade"
  ],
  "names": [
   "Ordens de serviço",
   "Programação de técnicos",
   "Checklists de campo",
   "Equipamentos e ativos",
   "Garantias de serviços",
   "Inspeção e qualidade",
   "Peças consumidas",
   "Atendimento emergencial",
   "Laudos e aceite",
   "Despesas de deslocamento"
  ]
 },
 {
  "id": "crop",
  "name": "Agricultura e culturas",
  "vertical": "agriculture",
  "roles": [
   "Engenheiro agrônomo",
   "Técnico agrícola",
   "Produtor"
  ],
  "names": [
   "Planejamento de safra",
   "Talhões e georreferência",
   "Culturas e variedades",
   "Calendário de plantio",
   "Monitoramento fenológico",
   "Irrigação e água",
   "Fertilidade e análises",
   "Pragas e doenças",
   "Colheita e produtividade",
   "Custos por cultura"
  ]
 },
 {
  "id": "livestock",
  "name": "Pecuária e zootecnia",
  "vertical": "agriculture",
  "roles": [
   "Zootecnista",
   "Médico veterinário",
   "Produtor"
  ],
  "names": [
   "Cadastro de rebanho",
   "Rastreabilidade animal",
   "Alimentação e pastagem",
   "Reprodução e manejo",
   "Sanidade veterinária",
   "Vacinação e calendário",
   "Pesagem e desempenho",
   "Bem-estar animal",
   "Custos por lote",
   "Comercialização de animais"
  ]
 },
 {
  "id": "agribusiness",
  "name": "Agroindústria e cooperativas",
  "vertical": "agriculture",
  "roles": [
   "Agrônomo",
   "Gestor de cooperativa",
   "Controladoria"
  ],
  "names": [
   "Armazenagem de grãos",
   "Classificação de qualidade",
   "Beneficiamento e processamento",
   "Comercialização agrícola",
   "Compras coletivas",
   "Gestão cooperativa",
   "Contratos de safra",
   "Clima e alertas",
   "Seguro rural e crédito",
   "Conformidade ambiental"
  ]
 },
 {
  "id": "mechanics",
  "name": "Oficinas e mecânica",
  "vertical": "mechanics",
  "roles": [
   "Mecânico",
   "Recepcionista técnico",
   "Gestor de oficina"
  ],
  "names": [
   "Recepção e triagem",
   "Histórico de veículos",
   "Diagnóstico e orçamento",
   "Ordem de reparo",
   "Peças e aplicações",
   "Tempo de mão de obra",
   "Garantia de oficina",
   "Plano de manutenção",
   "Controle de ferramentas",
   "Qualidade e entrega"
  ]
 },
 {
  "id": "retail",
  "name": "Lojas e varejo",
  "vertical": "commerce",
  "roles": [
   "Gerente de loja",
   "Operador de caixa",
   "Comprador"
  ],
  "names": [
   "Catálogo de produtos",
   "PDV e caixa",
   "Preço e promoções",
   "Vendas por loja",
   "Devoluções e trocas",
   "Fidelidade e recorrência",
   "Marketplace e pedidos",
   "Transferência entre lojas",
   "Ruptura e giro",
   "Margem por categoria"
  ]
 },
 {
  "id": "food",
  "name": "Alimentação e hotelaria",
  "vertical": "hospitality",
  "roles": [
   "Chef",
   "Gestor de restaurante",
   "Recepção"
  ],
  "names": [
   "Cardápio e fichas técnicas",
   "Compras perecíveis",
   "Validade e perdas",
   "Reservas autorizadas",
   "Pedidos e comandas",
   "Custos de receitas",
   "Higiene e registros",
   "Hospedagem e ocupação",
   "Equipe e turnos",
   "Avaliações de clientes"
  ]
 },
 {
  "id": "news",
  "name": "Jornais e comunicação",
  "vertical": "news_media",
  "roles": [
   "Jornalista",
   "Editor",
   "Checador de fatos"
  ],
  "names": [
   "Pauta e apuração",
   "Agenda de reportagem",
   "Fontes e consentimento",
   "Checagem de fatos",
   "Edição e aprovação",
   "Correções públicas",
   "Publicação multicanal",
   "Direitos de imagem",
   "Monetização de assinaturas",
   "Métricas de audiência"
  ]
 },
 {
  "id": "faith",
  "name": "Igrejas e organizações sociais",
  "vertical": "faith_nonprofit",
  "roles": [
   "Administrador",
   "Tesoureiro",
   "Líder comunitário"
  ],
  "names": [
   "Agenda de cultos e eventos",
   "Gestão de espaços",
   "Projetos sociais",
   "Prestação de contas",
   "Doações autorizadas",
   "Escalas voluntárias",
   "Estoque solidário",
   "Contratos e fornecedores",
   "Comunicação comunitária",
   "Proteção de dados sensíveis"
  ]
 },
 {
  "id": "education",
  "name": "Educação e capacitação",
  "vertical": "education",
  "roles": [
   "Coordenador",
   "Professor",
   "Secretaria"
  ],
  "names": [
   "Calendário letivo",
   "Turmas e horários",
   "Matrículas autorizadas",
   "Plano de aulas",
   "Avaliações e progresso",
   "Conteúdo pedagógico",
   "Formação continuada",
   "Comunicação com responsáveis",
   "Financeiro educacional",
   "Biblioteca e acervo"
  ]
 },
 {
  "id": "health",
  "name": "Saúde e clínicas",
  "vertical": "health",
  "roles": [
   "Diretor técnico",
   "Profissional de saúde",
   "Recepção"
  ],
  "names": [
   "Agenda clínica",
   "Prontuário segregado",
   "Consentimento informado",
   "Faturamento de convênios",
   "Controle de insumos",
   "Triagem administrativa",
   "Protocolos supervisionados",
   "Manutenção de equipamentos",
   "Proteção de dados de saúde",
   "Indicadores assistenciais"
  ]
 },
 {
  "id": "construction",
  "name": "Obras e imobiliário",
  "vertical": "construction",
  "roles": [
   "Engenheiro civil",
   "Arquiteto",
   "Mestre de obras"
  ],
  "names": [
   "Orçamento de obras",
   "Cronograma físico financeiro",
   "Medições e avanço",
   "Suprimentos de obra",
   "Contratos de empreitada",
   "Inspeção e segurança",
   "Diário de obra",
   "Projetos e revisões",
   "Gestão de imóveis",
   "Entrega e pós-obra"
  ]
 },
 {
  "id": "logistics",
  "name": "Transporte e logística",
  "vertical": "logistics",
  "roles": [
   "Gestor logístico",
   "Motorista",
   "Planejador"
  ],
  "names": [
   "Controle de frotas",
   "Ordens de transporte",
   "Roteirização autorizada",
   "Combustível e consumo",
   "Manutenção preventiva",
   "Recebimento e expedição",
   "Rastreamento consentido",
   "Ocorrências de entrega",
   "Frete e custos",
   "Planejamento de capacidade"
  ]
 },
 {
  "id": "technology",
  "name": "TI e cibersegurança",
  "vertical": "all",
  "roles": [
   "Engenheiro de software",
   "Segurança",
   "DPO"
  ],
  "names": [
   "Inventário de sistemas",
   "Controle de identidades",
   "Gestão de segredos",
   "Backups e restauração",
   "Monitoramento e alertas",
   "Gerenciamento de incidentes",
   "Vulnerabilidades e patches",
   "Integrações e APIs",
   "Logs e auditoria",
   "Gestão de mudanças"
  ]
 },
 {
  "id": "global",
  "name": "Operação multinível e internacional",
  "vertical": "all",
  "roles": [
   "Diretor de expansão",
   "Jurídico local",
   "Compliance"
  ],
  "names": [
   "Bairro e comércio local",
   "Município e prefeitura",
   "Cidade e filiais",
   "Unidades estaduais",
   "Coordenação regional",
   "Gestão nacional",
   "Coordenação continental",
   "Operação internacional",
   "Moedas e câmbio",
   "Tributos por jurisdição"
  ]
 }
];
export const SCALE_LEVELS = Object.freeze([
 {id:'neighborhood',name:'Bairro / comunidade',rank:1,needs:['responsável local','cadastro de unidade']},
 {id:'municipality',name:'Município',rank:2,needs:['endereços municipais','regras fiscais locais']},
 {id:'city',name:'Cidade',rank:3,needs:['segmentação por bairro','capacidade de atendimento']},
 {id:'city_branches',name:'Cidade com filiais',rank:4,needs:['filiais e estoques separados','transferência auditável']},
 {id:'state',name:'Estadual',rank:5,needs:['tributos estaduais','unidades e gestores']},
 {id:'region',name:'Regional / multiestadual',rank:6,needs:['coordenação por região','report consolidado']},
 {id:'national',name:'Nacional',rank:7,needs:['governança nacional','tributação e conformidade multijurisdição']},
 {id:'continental',name:'Continental',rank:8,needs:['fusos horários','tradução e legislação regional']},
 {id:'international',name:'Internacional',rank:9,needs:['contratos internacionais','moedas e regras locais']},
 {id:'global',name:'Global / mundial',rank:10,needs:['residência de dados e LGPD/local','gestão consolidada de riscos e moedas']}
]);
export const MODULE_FAMILIES = Object.freeze(families.map(x=>Object.freeze({...x,count:x.names.length})));
const slug = s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const MODULES = Object.freeze(families.flatMap(f=>f.names.map((name,i)=>Object.freeze({
 id:f.id+'.'+String(i+1).padStart(2,'0'),key:f.id+'-'+slug(name),name,family:f.id,familyName:f.name,
 vertical:f.vertical,requiredRoles:[...f.roles],status:'specified',implementation:'not_connected',
 requiresEvidence:true,automated:false,
 scope:'workspace',minScale:'neighborhood',risk:['tax','health','faith','livestock','crop'].includes(f.id)?'professional_review':'human_approval',
 requirements:['tenant_isolation','owner','inputs_and_outputs','permission_check','audit_log','tests','rollback','integration_homologation']
}))));
export const CATALOG_SUMMARY = Object.freeze({familyCount:MODULE_FAMILIES.length,moduleCount:MODULES.length,
 coreCount:MODULES.filter(m=>m.vertical==='all').length,
 verticalCount:MODULES.filter(m=>m.vertical!=='all').length,
 existingProcedures:72,
 distinction:'Especificado não significa instalado, integrado, homologado ou operacional.'});
export function getModule(id){return MODULES.find(x=>x.id===id)||null;}
export function listForIndustry(industry,{includeGeneral=true}={}){
 if(typeof industry!=='string'||industry.length>60)throw Error('industria_invalida');
 return MODULES.filter(x=>x.vertical===industry||(includeGeneral&&x.vertical==='all'));
}
export function scaleCheck(level,{branches=1,currencies=['BRL'],jurisdictions=['BR'],restoredBackup=false,localTaxRules=false,tenantRlsVerified=false}={}){
 const scale=SCALE_LEVELS.find(s=>s.id===level);
 if(!scale)throw Error('escala_invalida');
 const pending=[];
 if(!tenantRlsVerified)pending.push('isolamento_multiempresa_nao_validado');
 if(scale.rank>=4&&branches<2)pending.push('filiais_independentes_nao_cadastradas');
 if(scale.rank>=2&&!localTaxRules)pending.push('regras_tributarias_locais_nao_homologadas');
 if(scale.rank>=5&&!restoredBackup)pending.push('restauracao_de_backup_nao_provada');
 if(scale.rank>=9&&(currencies.length<2||jurisdictions.length<2))pending.push('operacao_multimoeda_ou_multijurisdicao_nao_homologada');
 return {level,rank:scale.rank,needs:scale.needs,ready:pending.length===0,pending,
 note:'Checklist é preliminar. Exige validação jurídica, fiscal e operacional em cada localização.'};
}
export function readiness(m,{owner=false,source=false,permissions=false,tests=false,integrated=false,realExecution=false,reviewed=false}={}){
 if(!m||!getModule(m.id))throw Error('modulo_desconhecido');
 const signals={owner,source,permissions,tests,integrated,realExecution,reviewed};
 const missing=Object.entries(signals).filter(([,v])=>v!==true).map(([k])=>k);
 return {id:m.id,operational:missing.length===0,missing,
 disclaimer:'Estar listado no catálogo não é evidência de que um software está rodando.'};
}
