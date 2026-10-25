# CAPISOL — Mineração oficial de APIs e skills

## Resultado da pesquisa

### WhatsApp Cloud API da Meta

**Decisão: integrar como adapter oficial alternativo ao Respond.io.**

A Cloud API envia mensagens pelo endpoint oficial da Meta. Mensagens livres de serviço só podem responder dentro da janela de atendimento de 24 horas; fora dela, a empresa precisa usar template aprovado. A Meta também exige opt-in. A documentação de preços informa uma faixa mensal gratuita de 1.000 mensagens de serviço por número, além de janelas de entrada gratuitas em determinados fluxos. Isso não torna marketing outbound ilimitado e gratuito.

Integração criada no gateway: provider `whatsapp_cloud`.

Fonte: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
Fonte: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing

### TikTok Content Posting API

**Decisão: integrar como adapter separado do TikTok Ads.**

O perfil TikTok da CAPISOL não é suficiente para operar a API. A aplicação precisa ser registrada no TikTok for Developers, habilitar o Content Posting API, obter aprovação do escopo `video.publish`, autorizar a conta criadora e usar token e open ID. O domínio que hospeda o vídeo ou foto também precisa ser verificado. Clientes não auditados ficam restritos a conteúdo privado.

Integração criada no gateway: provider `tiktok_content`, com consulta de informações do criador e inicialização de publicação por URL. O default é `SELF_ONLY` para evitar exposição acidental.

Fonte: https://developers.tiktok.com/doc/content-posting-api-get-started/
Fonte: https://developers.tiktok.com/products/content-posting-api/

### TikTok Business API / Ads

**Decisão: manter o adapter de anúncios existente, mas não confundir com postagem orgânica.**

A Business API cobre campanhas, criativos, públicos, relatórios, leads e webhooks. Ela exige conta Business Center, advertiser ID, app e autorização. O perfil público `@capisol4` não fornece esses ativos.

Fonte: https://business-api.tiktok.com/portal
Fonte: https://github.com/tiktok/tiktok-business-api-sdk

### Google Places

**Decisão: manter com controle de custo e revisar o uso de dados.**

A pesquisa existente usa Google Places para descobrir empresas. A API é pay-as-you-go e o custo depende de SKU e campos retornados. Field masks reduzem custo e latência. Os termos oficiais restringem scraping, exportação, cópia de nomes, endereços, reviews e criação de diretórios ou produtos concorrentes. O fluxo CAPISOL deve solicitar apenas campos necessários, manter atribuição e não transformar a base do Google em lista comercial exportável sem revisão dos termos.

Fonte: https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
Fonte: https://developers.google.com/maps/terms

### OpenStreetMap Nominatim e Overpass

**Decisão: não integrar como substituição automática agora.**

São opções abertas e úteis para pesquisa geográfica, mas o Nominatim público limita uso a no máximo 1 requisição por segundo, exige User-Agent/Referer, atribuição e proíbe uso sistemático, autocomplete e bulk geocoding recorrente. Instâncias públicas de Overpass são destinadas a pequenos projetos e possuem limites operacionais. Para uma operação comercial contínua, seria necessário cache, proxy próprio, extrato regional ou instância própria.

Fonte: https://operations.osmfoundation.org/policies/nominatim/
Fonte: https://wiki.openstreetmap.org/wiki/Overpass_API

## Skills e ferramentas avaliadas

- `whatsapp-playbooks`: adotado como regra operacional. Proíbe disparos não solicitados, loops de WhatsApp Web/Desktop e evasão de limites.
- `revops`: adotado para lifecycle, scoring, roteamento, SLA e higiene de CRM.
- `github-gem-seeker`: usado para procurar SDKs oficiais e bibliotecas maduras antes de reimplementar.
- `internet-skill-finder`: consultado, mas a busca de skills retornou cache sem correspondências devido a falha do endpoint de leitura do GitHub. Nenhuma skill externa foi integrada sem validação.
- SDK oficial `tiktok-business-api-sdk`: localizado, mas não copiado para o frontend; o gateway usa HTTP server-side para não adicionar dependência desnecessária.

## Falhas que ainda existiam e foram corrigidas nesta rodada

1. O gateway só tinha Respond.io para WhatsApp. Foi adicionado o adapter oficial Meta Cloud API.
2. TikTok Ads e TikTok orgânico estavam misturados conceitualmente. Foi criado o provider separado `tiktok_content`.
3. A configuração não declarava os tokens e IDs necessários para os novos providers. O `.env.example` foi ampliado sem inserir segredos.
4. A fila não tinha teste de estado residual robusto. O caminho da fila passou a ser resolvido dinamicamente por ambiente e os testes foram corrigidos.
5. A demo não expunha a avaliação de outreach. Foi criada a tela `/outreach/`.

## Bloqueios externos restantes

- WhatsApp Cloud: falta WhatsApp Business Phone Number ID, token permanente ou de servidor e webhook de status.
- TikTok Content: falta app aprovada, escopo `video.publish`, token, open ID e domínio verificado para mídia.
- TikTok Ads: falta advertiser ID e autorização do Business Center.
- GitHub: o token de publicação continua retornando 403.
- A publicação real continua desativada por padrão até que os recursos acima sejam autorizados e um primeiro envio seja aprovado explicitamente.

## Critério de pronto

A integração estará pronta para uso quando cada provider retornar status configurado, houver teste sandbox/privado, webhook ou recibo de status, logs redigidos, revogação documentada, limites ativos e uma execução real aprovada. “API encontrada” ou “perfil público encontrado” não conta como integração concluída.
