# CAPISOL — Mapa de conclusão, custos e pendências

Atualizado em 24/10/2026. Este documento separa o que já está implementado, o que é gratuito, o que tem custo variável e o que só pode ser concluído manualmente pelos sócios ou por profissionais habilitados.

## Percentual publicado no GitHub

O remoto `origin/main` está no commit `1e0adcf`. O ambiente local está no commit `f0753c8` e possui 12 commits à frente do remoto. Portanto, **0% dos 12 commits mais recentes está publicado no GitHub**. A base anterior continua publicada, mas não é correto transformar isso em um percentual funcional sem definir um denominador de escopo. Para o escopo novo desta rodada, o número operacional é: local 100% testado; remoto 0% atualizado.

## Mapa de custos e decisões

| Item | Estado | Gratuito? | Custo provável | Ação e link |
|---|---|---:|---:|---|
| GitHub Pages para frontend estático | Demo disponível | Sim | R$ 0 de hospedagem, sujeito a domínio | Publicar após resolver `contents: write`: [GitHub Pages](https://pages.github.com/) |
| Domínio próprio | Não configurado nesta sessão | Não | Valor anual conforme registrador | Comprar e configurar DNS/HTTPS: [Registro.br](https://registro.br/) |
| Supabase Free | Código já usa padrões compatíveis | Sim, com limites | R$ 0 | Banco/Auth inicial: [Supabase Pricing](https://supabase.com/pricing) |
| Supabase Pro | Recomendado quando backup automático e operação contínua forem necessários | Não | US$ 25/mês, mais consumo | Ativar depois de validar caixa: [Supabase Pricing](https://supabase.com/pricing) |
| MFA básico no Supabase | Disponível no Free | Sim | R$ 0 | Criar dois usuários individuais e ativar MFA: [Supabase Auth MFA](https://supabase.com/docs/guides/auth/auth-mfa) |
| MFA por telefone avançado | Não necessário para o primeiro estágio | Não | A partir de US$ 75/mês no primeiro projeto, conforme página de preços | Evitar inicialmente; usar aplicativo autenticador |
| n8n Community self-hosted | Não integrado como runtime de produção ainda | Licença gratuita | Infraestrutura/VPS à parte | Pode operar gratuitamente em servidor próprio: [n8n Community](https://docs.n8n.io/deploy/host-n8n/community-edition-features/) |
| n8n Cloud | Não necessário no início | Não | A partir do plano publicado pelo provedor | Só contratar se o custo de operação superar a economia do self-host: [n8n Pricing](https://n8n.io/pricing/) |
| WhatsApp Cloud API | Adapter oficial criado, credenciais ausentes | Parcial | Mensagens cobradas por categoria; serviço tem faixa gratuita mensal da Meta | Criar conta, número, token e webhook: [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages) |
| Respond.io | Adapter existente, canal não comprovado | Não necessariamente | Plano conforme workspace e uso | Usar somente se a equipe preferir a camada omnichannel: [Respond.io](https://respond.io/pricing) |
| Instagram Graph API | Adapter/demo existente | API sem mensalidade própria conhecida | Pode exigir conta Business e custos indiretos | Vincular Página/Business Manager e token: [Meta for Developers](https://developers.facebook.com/docs/instagram-api/) |
| TikTok Content Posting API | Adapter oficial criado | API sem mensalidade própria conhecida | Sem custo de API declarado, mas exige aprovação | Registrar app e pedir `video.publish`: [TikTok Direct Post](https://developers.tiktok.com/doc/content-posting-api-get-started/) |
| TikTok Business API | Adapter de Ads existente | Acesso depende de aprovação | Mídia paga e anúncios têm custo próprio | Configurar advertiser e Business Center: [TikTok Business API](https://business-api.tiktok.com/portal) |
| Google Places API | Usada na prospecção | Não é ilimitada | Pay-as-you-go por SKU/campos | Reduzir campos, quotas e alertas: [Places Billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) |
| OSM Nominatim | Não integrado | Público, mas limitado | R$ 0 no endpoint público; custo de operação se hospedar | Só usar com baixa frequência, User-Agent e cache: [Nominatim Policy](https://operations.osmfoundation.org/policies/nominatim/) |
| LexML/Planalto | Biblioteca de fontes | Sim | R$ 0 de acesso público | Base jurídica primária: [LexML](https://projeto.lexml.gov.br/) e [Planalto](https://www4.planalto.gov.br/legislacao) |
| NFS-e nacional | Não conectado | Documentação pública | Pode depender de certificado, município e provedor | Validar com contador e município: [APIs NFS-e](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/apis-prod-restrita-e-producao) |
| Contabilidade/fiscal | Biblioteca criada, decisão final não automatizada | Fontes públicas | Honorário profissional | Validar regime, ISS, ICMS, emissão e contratos com contador: [Receita Federal](https://www.gov.br/receitafederal/pt-br) |
| Jurídico | Biblioteca criada, parecer não automatizado | Fontes públicas | Honorário profissional | Validar contratos, representação, LGPD, comissão e energia com advogado |
| Backup de produção | Demo não é backup de produção | Free sem garantia suficiente | Supabase Pro ou backup próprio | Definir RPO/RTO, retenção e restauração antes do uso comercial |

Os valores acima são preços publicados ou estimativas condicionadas. APIs de mensagens, anúncios, SMS, domínio, certificado, certificado digital, mídia paga e serviços profissionais não devem ser tratados como custo zero.

## O que já está implementado

A CAPISOL possui frontend demonstrável, CRM inicial, catálogo de agentes, regras de preço, plano comercial do Acre, biblioteca operacional, motor de tokens delegados, minerador de oportunidades, gateway, fila idempotente, auditoria de produção, prospecção responsável e adapters oficiais para WhatsApp Cloud e TikTok Content Posting.

A prospecção bloqueia contatos sem opt-in ou base documentada, respeita supressão, cooldown, limite diário e pedido de saída. A publicação real está desligada por padrão.

## O que ainda falta para produção

### 1. Publicação no GitHub

O código local está 12 commits à frente do GitHub. É necessário liberar `contents: write` na credencial GitHub ou usar um token fine-grained com acesso ao repositório `eduardocoutinho2546-cell/CAPISOL`. Depois disso, executar push, workflow de auditoria e validar o GitHub Pages.

### 2. Dois administradores

Criar dois usuários separados, um para cada sócio. Cada usuário deve ter MFA por aplicativo autenticador, recuperação independente e registro de auditoria. Nunca compartilhar uma senha administrativa. A tela de login ainda não deve ser considerada pronta enquanto esses usuários e políticas não forem criados no ambiente de produção.

### 3. Segredos e tokens

Criar tokens somente no backend ou no gerenciador de segredos do provedor. O GitHub recebe apenas `.env.example`, nomes de variáveis e configuração sem valores. Cada token delegado precisa de escopo, validade, limite de uso, hash, revogação e histórico.

### 4. WhatsApp oficial

Criar o portfólio Meta Business, adicionar o número da CAPISOL, obter `Phone Number ID`, token de servidor e webhook. Criar e aprovar templates. Fazer primeiro teste com número dos sócios e confirmar recebimento de status pelo webhook. Só depois habilitar fila de leads com opt-in.

### 5. Redes sociais

Instagram precisa de conta Business, Página vinculada e token. TikTok precisa de app, escopo aprovado e autorização da conta. O sistema deve oferecer rascunho e download mesmo quando a publicação direta não estiver autorizada.

### 6. Nota fiscal e contabilidade

A emissão depende de município, tipo de serviço, regime tributário, certificado e credenciais. O agente pode preparar dados e rascunho, mas contador deve validar códigos de serviço, retenções, ISS, ICMS, Simples, NFS-e e contratos de comissão.

### 7. Jurídico e regulatório

A biblioteca usa Planalto, LexML, ANEEL, Receita, NFS-e, Câmara e Senado como fontes de pesquisa. Ela não substitui parecer. Advogado deve revisar contrato do parceiro, comissão de 4% a 6%, responsabilidade por instalação, garantias, LGPD, publicidade, representação comercial e modelos futuros de geração compartilhada, autoconsumo remoto, cooperativa e locação.

## Modelo de autonomia aprovado

Agentes podem buscar parceiros, localizar prestadores, pedir orçamentos, montar comparativos, gerar propostas preliminares, fazer follow-up permitido, atualizar CRM e notificar os sócios.

Agentes não podem fechar contrato, comprar equipamentos, contratar dívida, aprovar projeto de usina, alterar regime tributário, conceder desconto fora da alçada, mudar preço interno, emitir documento técnico final ou publicar campanha real sem aprovação registrada.

O fluxo é: agente prepara → gerente revisa → conselho compara margem, carga, risco e capacidade → sócio aprova ou rejeita → sistema registra → agente executa somente o escopo aprovado.

## Simulações de atendimento incorporadas

A skill Escritório 4.0 agora possui roteiros para cliente econômico, cliente técnico, cliente inseguro, cliente urgente e parceiro comercial. Todos começam por diagnóstico, não por desconto. O agente identifica problema, consumo, horizonte, preferência de desembolso e decisor; apresenta duas opções comparáveis; declara premissas; registra objeções; e marca a próxima ação.

A psicologia aplicada é psicologia de compra ética: reduzir incerteza, demonstrar valor, dar controle ao cliente e evitar promessas falsas. O agente não usa escassez artificial, medo, pressão ou economia garantida sem memória de cálculo.

## Falhas de processo identificadas

- A arquitetura atual ainda não possui autenticação de produção comprovada para os dois sócios.
- Os adapters oficiais existem, mas estão sem credenciais e webhooks reais.
- A demo usa gateway local/temporário; isso não é infraestrutura de produção persistente.
- O backup automático de produção ainda não está comprovado.
- A tabela comercial e a tabela interna precisam ser separadas em dados persistentes com aprovação e histórico.
- O plano anual de limpeza ainda depende de custos reais e deliberação do conselho.
- Parceiros e prestadores ainda precisam de cadastro, score, cotação, SLA, documentos e trilha de aprovação.
- A base jurídica e contábil está organizada como referência, mas não como parecer automático; toda decisão de alto risco precisa de profissional.
- A publicação GitHub está atrasada em 12 commits.

## Critério de 100%

A CAPISOL só será considerada pronta para produção quando: o remoto estiver no mesmo commit auditado; os dois administradores estiverem com MFA; os backups forem testados por restauração; o gateway estiver em serviço persistente; WhatsApp, Instagram e TikTok tiverem credenciais oficiais, webhook e teste comprovado; a emissão fiscal tiver validação do contador; os contratos tiverem revisão jurídica; as tabelas de preço tiverem versionamento; e o conselho tiver um fluxo de aprovação registrado.

## Referências oficiais

[1]: https://supabase.com/pricing "Supabase Pricing"
[2]: https://docs.n8n.io/deploy/host-n8n/community-edition-features/ "n8n Community Edition"
[3]: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing "WhatsApp Business Platform Pricing"
[4]: https://developers.tiktok.com/doc/content-posting-api-get-started/ "TikTok Content Posting API"
[5]: https://developers.google.com/maps/documentation/places/web-service/usage-and-billing "Google Places Usage and Billing"
[6]: https://projeto.lexml.gov.br/ "LexML"
[7]: https://www4.planalto.gov.br/legislacao "Portal da Legislação"
[8]: https://www.gov.br/receitafederal/pt-br "Receita Federal"
[9]: https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/apis-prod-restrita-e-producao "NFS-e APIs"
