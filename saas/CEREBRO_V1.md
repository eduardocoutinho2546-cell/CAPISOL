# Contrato público do Cérebro CAPISOL v1

O barramento privado `public.eventos` fica acessível somente por backend autorizado, no projeto Supabase CAPISOL. **Nunca** usar chave `service_role` ou sessão BelEnergy no navegador, GitHub Pages, Metricool ou WhatsApp.

A função pura `saas/cerebro-v1-guard.mjs` é um filtro para rascunhos de marketing e mensagens, **não envia mensagens**. Todo canal permanece inicialmente em modo sombra, com kill switch ativo, telefone não confirmado e aprovação exigida. O backend deve repetir as mesmas verificações; guard de frontend isolado não é controle de segurança suficiente.

A integração real com CAPISOL Gestão dependerá de endpoint Edge com autenticação, política RLS tenant-safe, rate limit, revisão humana, consentimento e testes de rejeição, sem duplicar o roteador do PR privado #22.

Teste local: `node --test saas/cerebro-v1-guard.test.mjs`. Nenhuma alteração foi feita no `index.html`, em dados de clientes, no login, na cobrança ou em sistemas financeiros.
