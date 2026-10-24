# CAPISOL Integration Gateway

Gateway server-side para conectar a plataforma a Instagram Graph API, TikTok for Business Ads API e Respond.io/WhatsApp.

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

## Limite conhecido

O adapter TikTok cobre a criação de anúncios quando `advertiser_id`, `adgroupId`, criativos e permissões existem. Ele não promete publicação orgânica no perfil TikTok. O adapter WhatsApp usa Respond.io; sem canal conectado, ele falha de forma explícita e não simula envio.
