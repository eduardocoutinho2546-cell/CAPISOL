# CAPISOL Gestão / Escritório 4.0 — núcleo multiempresa verificável

**Data:** 2026-10-25. **Fase:** confiabilidade operacional e homologação, **não** lançamento comercial nem tabela de preços.
**Repositório-base de produto:** `CAPISOL`. A documentação/agentes especializados continuam no repositório privado do escritório.
**Ambiente inicial:** CAPISOL Energia Solar, com CRM legado `public.docs` mantido e protegido.

## Modelo: um código, muitas empresas, vários mercados

```text
CAPISOL Gestão (marca / painel SaaS)
  → Supabase Auth (uma conta por pessoa)
  → Workspace isolado (company / rural_producer / cooperative / association)
      → Permissões por usuário e módulo, revogáveis pelo administrador daquela empresa
      → Operação comum (tarefas, comercial, financeiro, documentos, auditoria, 72 setores)
      → Módulos setoriais ativados quando houver evidência de necessidade
          → Solar: propostas solares, engenharia e CAPISOL+
          → Rural: produtores, propriedades, atividades e conformidade agrária
          → Comércio/serviços/indústria/logística/etc: processos próprios sem dados CAPISOL
      → Pipeline editorial legítimo: 12 temas × 5 formatos, arquivos privados, direitos, revisão
      → Provedores de IA (GPT / Claude / Gemini / Antigravity) SOMENTE em backend homologado
```

### Migrações aplicadas no projeto Supabase capisol-gestao
1. `office_40_multiempresa_rural_editorial`: `kind`, `industry_code`, `plan_code` internos; cinco tabelas com RLS e escopos. Fonte: `docs/sql/office-multiempresa-rural-editorial.sql`.
2. `office_40_invites_tenants_verified`: convite de novos workspaces pela administração CAPISOL, conta convidada com e-mail confirmado, aceite pelo próprio titular. Sem dar ao provedor acesso automático. Fonte: `docs/sql/office-multiempresa-convites.sql`.
3. `office_40_invites_listing_secured`: lista de convites visível somente para a conta convidada.
4. `office_40_scopes_restrict_implemented`: restringe grants delegáveis a `rural.read`, `rural.write`, `media.read` e `media.write`. Escopos financeiros/fiscais não foram liberados porque os controles correspondentes ainda não foram homologados.

**Importante:** o esquema é aditivo; nenhuma compra, pagamento, documento fiscal ou conta social foi criada. `plan_code` não é faturamento nem atribuição de permissão. Proprietários devem aceitar convite antes de acessar o próprio tenant.

### Separação de responsabilidades
- Dono/administrador do tenant: membros, operações internas e decisões autorizadas, sem controle automático sobre dados de outros tenants.
- Gestor: visão operacional e financeira definida pelas políticas existentes. Refino de acesso por função ainda exige revisão do modelo antigo de `manager`.
- Operador: suas tarefas e escopos rurais ou de mídia explicitamente concedidos.
- Observador: acesso conforme políticas específicas; não ganha acesso financeiro.
- Administrador da plataforma: pode iniciar convite, mas a propriedade dos dados cabe ao cliente após aceite.
- Agente de IA: rascunhos e recomendações com quotas e logs; jamais usuário administrador de banco ou substituto de profissional habilitado.

## Trabalho rural
- `capisol_rural_producers`: produtor/organização, nome, município/UF, atividade e status de verificação; mantém apenas os quatro últimos dígitos do documento para evitar armazenamento desnecessário.
- `capisol_rural_properties`: imóvel, área em hectares, atividade, vínculo que rejeita `workspace_id` cruzado.
- Antes de regularização fundiária, contratos, crédito agrícola ou CAR/CCIR reais, precisa de fluxo de dados completos em cofre privado, finalidade LGPD, verificação profissional e integrações oficiais.
- O cadastro em rascunho **não** comprova titularidade, posse, inscrição no CAR ou situação sanitária/ambiental.

## Marketing, vídeo e repurpose
A estratégia é gravar material original com equipe autorizada, organizar arquivo bruto, cortes e legendas, revisar e distribuir conteúdos distintos por plataforma.
Os 12 pilares em `saas/verticals.mjs` têm cinco vertentes: vídeo curto, entrevista/corte, artigo com bastidores, vídeo longo e carrossel. São **60 pautas internas**, não 60 contas falsas; não inflar métricas via contas coordenadas.

Fluxo:
1. Videomaker entrega o bruto e autorização de imagem em armazenamento privado.
2. Editor/clipador marca cortes, aprova legenda e aspecto 9:16, 1:1 ou 16:9.
3. `workers/media/clipper.mjs` gera plano FFmpeg; execução somente em máquina autorizada, com direitos confirmados e env de aprovação.
4. Revisão editorial e marca; só conta corporativa verdadeira e API autorizada pode publicar.
5. Métricas observáveis do próprio perfil retroalimentam o calendário.

**Conexão existente verificada:** Metricool da CAPISOL tem Instagram `capisol_ac` e Google Business Profile; isso NÃO repassa credenciais ao backend ou autoriza posting a outras redes. TikTok, YouTube, LinkedIn e X exigem as contas reais, OAuth e revisão de termos da plataforma. A política do TikTok e do X proíbe coordenação de contas inautênticas para manipular alcance:
- https://www.tiktok.com/community-guidelines/pt/integrity-authenticity/
- https://help.x.com/en/rules-and-policies/authenticity

## GPT, Claude, Gemini e Antigravity
- `saas/ai-routing.mjs` define responsabilidades e quotas locais, não uma conexão real aos quatro provedores.
- GPT: textos, atendimento assistido e resumos.
- Claude: rascunhos jurídicos, revisão técnica e documentação longa.
- Gemini: análise multimodal, pesquisa com fonte e documentos.
- Antigravity: agente de desenvolvimento com branch/PR e acesso restrito a arquivos e projetos aprovados; não é trabalhador genérico de faturamento.
- Orquestração futura: segredos no backend, RAG por tenant, permissões de ferramenta, limite de custo, rastreio de tokens medidos pelo tokenizador do modelo e revisão humana.
- **Não existem repositórios que aumentem a janela física de contexto contratada.** Repomix organiza código, Tiktoken estima tokens, LLMLingua reduz prompts, Litellm unifica chamadas sujeitos às licenças/versões e o RAG evita repassar arquivos completos.

Candidatos reais validados no GitHub em 25/10/2026 (catalogados, **não instalados**):
- https://github.com/yamadashy/repomix (MIT)
- https://github.com/openai/tiktoken (MIT)
- https://github.com/microsoft/LLMLingua (MIT)
- https://github.com/BerriAI/litellm (verificar licença exata por componente)
- https://github.com/FFmpeg/FFmpeg (verificar condições de build GPL/LGPL)
- https://github.com/Breakthrough/PySceneDetect (BSD-3-Clause)
- https://github.com/ggml-org/whisper.cpp (MIT)
- https://github.com/mifi/lossless-cut (GPL-2.0)

## Bloqueios para poder alegar "100% operacional"
- Migração e reconciliação de CRM legado sem quebrar a gestão existente; cada tenant novo precisa começar isolado.
- Proteção técnica da `main`, backups com restauração testada e CI com teste de escalonamento de privilégio/tenant.
- Revisão dos `SECURITY DEFINER` atuais e do formulário público; proteção contra senhas vazadas no Auth.
- Convite aceito por titular real; 2FA, recuperação de acesso e revogação em todos os conectores.
- Emissor NFS-e, cobrança recorrente, Open Finance e homologação profissional por empresa/município.
- Upload privado de mídias, isolamento dos workers, retenção, transcrição e produção audiovisual real.
- OAuth por rede e provas de que agendamento/publicação/analytics funcionam em cada canal.
- Monitoramento, incidentes, disaster recovery, performance com vários tenants e indicadores reais dos 72 setores.
- Política de licenças/open source para distribuir SaaS multiempresa, contratos LGPD, consentimento e uso de modelos.
- Bateria E2E para cada jornada (onboarding, comercial, contrato, financeiro, fiscal, rural, marketing, suporte).

**Status verificado não significa operação integral**: migrações e alguns fluxos de UI/CLI têm testes; provedores, contas externas, mídia enviada, clientes reais e operações reguladas precisam de homologação em ambiente de teste com aceites.

## Como auditar
```sh
node --test gateway/test/*.test.mjs saas/test/*.test.mjs workers/media/*.test.mjs
node tools/audit-capisol.mjs
node tools/audit-production.mjs
```
O teste de UI `tools/test-office-ui.mjs` cobre login, tarefas, 72 setores, produtores/propriedades, 60 pautas internas e fila audiovisual usando rede simulada. Testes RLS transacionais com rollback não criam clientes fictícios no banco.

**Regra CAPISOL**: este trabalho é infraestrutura e qualidade; não iniciar funil comercial de revenda antes de homologar a operação.
