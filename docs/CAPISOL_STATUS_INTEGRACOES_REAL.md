# CAPISOL — Status real das integrações sociais

## Data da verificação

2026-10-24. A verificação foi feita por ferramentas autorizadas da sessão, separando acesso do conector de integração do código da CAPISOL.

## Resultado

| Canal | Conta/canal encontrado | Publicação real disponível | Integrado ao código da CAPISOL | Situação |
|---|---|---:|---:|---|
| Instagram | `@capisol_ac`, CAPISOL \| Energia Solar | Sim, limite 100/100 | Não | Conector autorizado, falta adapter/backend e fila de aprovação |
| TikTok Ads | Nenhum advertiser acessível | Não | Não | Falta vincular conta/anunciante ao Business Center autorizado |
| WhatsApp | Nenhum canal no workspace Respond.io | Não | Não | Falta conectar canal WhatsApp oficial no workspace |
| Facebook/Meta Ads | Conector Meta Ads disponível | Não verificado neste ciclo | Não | Falta conta, página, permissões e teste oficial |
| Google Ads | Conector autenticado | Leitura conforme escopo | Não | Não confundir leitura de conta com publicação de campanha |

## O que a demo atual faz

A tela de posts cria e organiza rascunhos, consulta dados quando há sessão Supabase e permite baixar imagens. Ela não publica automaticamente em Instagram, TikTok ou WhatsApp. A biblioteca, o minerador e o painel Acre são demos operacionais; não são a beta autônoma final.

## Critério para chamar de beta final

A CAPISOL só poderá chamar a versão de beta final quando houver: adapter de cada canal no backend; segredo no cofre, nunca no front-end; fila idempotente; consentimento e opt-in; aprovação humana para o primeiro ciclo; recibo de publicação; retry com timeout; logs redigidos; botão de revogação; métricas; e teste de recuperação.

## Bloqueios atuais

1. O conector Instagram está autorizado no ambiente Manus, mas o site estático GitHub Pages não consegue chamar MCP diretamente.
2. O TikTok não possui advertiser acessível nesta autorização.
3. O Respond.io não possui canal conectado, portanto não há WhatsApp para automatizar.
4. A publicação no GitHub continua bloqueada pelo token sem `contents: write`.

Nenhum desses bloqueios deve ser mascarado por uma tela que diga “conectado”.

## Gateway criado em 2026-10-24

Foi adicionado `gateway/`, um serviço server-side com modo `demo` e modo `live`, fila persistente com idempotência, autenticação administrativa, timeout, redaction, adapters para Instagram Graph, TikTok Ads e Respond.io, e bloqueio explícito de efeitos externos sem aprovação.

A URL temporária do gateway demo é `https://8787-iaozm4vz4c423qbq8z2cl-c1e7709c.us5.manus.computer`. Ela não publica nem envia mensagens enquanto estiver em modo demo.

Isso resolve a camada de software, mas não cria contas externas nem inventa canais: o TikTok e o Respond.io continuam precisando de ativos/canais autorizados.
