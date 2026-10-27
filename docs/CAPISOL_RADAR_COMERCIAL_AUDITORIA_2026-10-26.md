# CAPISOL — Auditoria e integração do Radar Comercial (26/10/2026)

## Fonte auditada
- Repositório: https://github.com/Mahanaicoach/google-maps-scraper-kit
- Licença do kit: MIT. Usa a imagem `gosom/google-maps-scraper:v1.18.1` em Docker (tag, não digest imutável).
- Funções: pesquisa por termos/cidade; geocodificação; grade para aumentar cobertura; deduplicação por `place_id`; enriquecimento de e-mails e redes sociais a partir de websites; CSV; skill para Claude Code.
- Dependências e riscos: motor de terceiros, navegador automatizado, Docker e acesso à internet; necessidade de conferir imagem, versão e permissões antes de execução. A instalação de skill por `npx` não foi realizada sem inspeção/sandbox.
- Segurança operacional: engine sem autenticação; compose original publica somente em 127.0.0.1, evitando exposição de rede por padrão. Não usar `0.0.0.0` sem gateway autenticado.
- Limitação jurídica/técnica: Google Maps Platform Termos, seção 3.2.3, proíbe scraping e extração de conteúdo Google Maps para fora do serviço. A API oficial de Places **não autoriza**, por si só, montar um banco permanente de nomes, endereços e avaliações. Ver: https://cloud.google.com/maps-platform/terms
- **Decisão:** não incorporar o motor de scraping nem suas extrações ao CRM. Adaptar apenas o padrão de classificação, deduplicação, triagem e coleta de evidências de fontes autorizadas.

## Banco e integração já existentes
Na auditoria em 26/10/2026, o Supabase `capisol-gestao` estava ativo, com `public.docs` protegido por RLS:
- 1.273 registros em `col='leads'`; fontes principais: 1.000 Receita Federal (dados abertos CNPJ), 154 pesquisa Google, 56 prospecção B2B e 63 sem origem.
- 1.257 cartões de triagem em `col='triagem_leads'`.
- 14 parceiros em `public.capisol_partner_radar`, cuja RLS atual tem política de leitura mas **não** de inclusão pelo navegador autenticado. Não foi alterada.
- O site tem `prospectar/index.html` com função remota `google-places`. O botão antigo **Adicionar todos** precisa de revisão de conformidade quanto a armazenamento em massa de dados Google; não tratá-lo como autorização genérica de importação.

## Entregue no branch de integração
- `radar/index.html`: interface para pesquisar fontes, classificar três tipos e registrar evidências com URL/data/descrição.
- `radar/radar-core.mjs`: validação de URLs, proteção contra origem Maps scraping, deduplicação por empresa/município e pontuação por sinais verificados, sem imputar intenção/ROAS.
- `radar/radar-core.test.mjs`: testes de rejeição de fontes indevidas, anúncio sem ID, duplicidade e contatos bloqueados.
- GitHub Actions: suite ampliada para executar os testes do radar em PR.
- Persistência pela sessão autenticada e RLS existentes em `docs`, na coleção `radar_comercial`.
- Só `cliente` pode ser enviado ao funil por clique e confirmação humana. O lead fica em `Qualificar`, sem opt-in presumido; regras de disparo do gateway continuam valendo.
- `parceiro` fica na triagem, sem falsamente afirmar vínculo ou cadastro definitivo em `capisol_partner_radar`.
- `concorrente`: mantém anúncio com URL e identificador para revisão; não gera métricas de vendas, segmentação, CTR ou ROAS.

## Prova e critérios de produção
1. Fazer revisão do PR e acompanhar os testes do GitHub Actions.
2. Confirmar que navegador autenticado consegue gravar `radar_comercial` no ambiente CAPISOL e que usuário deslogado não lê/grava; sem inserir registros falsos.
3. Validar com o jurídico o tratamento de contato de pessoa natural, necessidade, retenção e base legal (ANPD: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_hipoteses_legais_tratamento_de_dados_pessoais_legitimo_interesse ).
4. Somente promover um parceiro a `capisol_partner_radar` por rota backend dedicada com autenticação/autorização e revisão; não criar política INSERT genérica para todos.
5. Revisar a persistência de resultados da antiga pesquisa `google-places`, remover importação em massa não autorizada e manter consulta e links oficiais sob termos aplicáveis.
6. Para pesquisa recorrente, usar datasets públicos autorizados, indicações, portais institucionais e cadastros próprios; anúncios Meta/Google manualmente verificados com data e identificador. A ausência de anúncio numa amostragem não demonstra desativação.

## Indicadores — medir resultados reais, não volume de scraping
- Identificados novos / revisão pendente / P1 confirmados (separados por fonte e tipo).
- Parceiros qualificados após confirmação e área/cidade coberta.
- Leads abordados com base legal revisada, reuniões, propostas, vendas e margem de contribuição **da CAPISOL**.
- Anúncios observados com fonte e oferta; comparação de preços somente com kWp, instalação, homologação, garantia, prazo e CET equivalentes.
- Sem envio em massa, automação de WhatsApp ou gatilhos de precificação baseados em anúncios sem aprovação humana.

**Estado desta entrega:** implementação proposta por branch e PR. Não confundir código versionado com automação 24h em produção; ainda depende de revisão, merge, deploy e teste de sessão.
