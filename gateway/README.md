# CAPISOL Integration Gateway

Gateway server-side para conectar a plataforma a Instagram Graph API, Meta WhatsApp Cloud API, TikTok Content Posting API, TikTok for Business Ads API e Respond.io/WhatsApp.

## Modos

- `demo`: aceita e persiste jobs, mas sempre responde `dry_run`; não chama nenhum provedor externo.
- `live`: exige `ALLOW_LIVE_PUBLISH=true`, credenciais do provedor, aprovação explícita (`approvedAt`) e token administrativo.

Nunca coloque tokens em HTML, GitHub Pages ou no campo `payload` do job.

## Iniciar

```bash
cp .env.example .env
# preencha somente no ambiente seguro do servidor
set -a; . ./.env; set +a
npm start
```

## Testar

```bash
npm test
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/v1/integrations/status
```

## Operação da fila

Criar job idempotente:

```bash
curl -X POST http://127.0.0.1:8787/v1/queue \
  -H 'content-type: application/json' \
  -H 'idempotency-key: capisol-demo-001' \
  -d '{"provider":"instagram","payload":{"mediaUrl":"https://cdn.example.com/post.jpg","caption":"Teste CAPISOL"}}'
```

Executar um job em modo demo:

```bash
curl -X POST http://127.0.0.1:8787/v1/queue/capisol-demo-001/execute
```

Em modo live, a execução só ocorre com `Authorization: Bearer $GATEWAY_ADMIN_TOKEN` e uma propriedade `approvedAt` registrada. Publicações e mensagens reais são efeitos externos; exigem revisão humana no primeiro ciclo.

## Providers oficiais disponíveis

- `instagram`: publicação de imagem via Instagram Graph API.
- `whatsapp_cloud`: mensagens de serviço dentro da janela de 24 horas ou templates aprovados fora dela.
- `tiktok_content`: postagem por URL verificada com `SELF_ONLY` como padrão conservador.
- `tiktok_ads`: criação de anúncios quando advertiser, ad group e criativos existem.
- `whatsapp`: envio via Respond.io quando há canal conectado.

## Limite conhecido

O adapter TikTok Ads cobre a criação de anúncios quando `advertiser_id`, `adgroupId`, criativos e permissões existem. A postagem orgânica é um provider separado (`tiktok_content`) e exige app, escopo e conta criadora autorizados. O adapter WhatsApp usa Respond.io; sem canal conectado, ele falha de forma explícita e não simula envio. A alternativa `whatsapp_cloud` exige Phone Number ID, token e templates quando fora da janela de atendimento.
