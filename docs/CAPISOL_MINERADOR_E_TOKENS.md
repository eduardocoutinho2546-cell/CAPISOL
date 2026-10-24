# CAPISOL — Minerador de oportunidades e tokens delegados

## Minerador de oportunidades

O minerador não executa um loop infinito dentro do navegador. Ele é uma fila monitorada por tarefa agendada ou trigger, com fontes permitidas, intervalo mínimo, orçamento, limite de requisições, cache, deduplicação, score de oportunidade e revisão humana.

Cada item registra fonte, URL, data da leitura, tipo de oportunidade, evidência, hipótese de ganho, risco, custo de integração, responsável e estado. Os estados são `novo`, `validando`, `proposto`, `aprovado`, `integrado`, `rejeitado` e `bloqueado`.

O minerador pode encontrar APIs oficiais, bibliotecas, mudanças de preço, práticas comerciais, oportunidades de parceria, notícias regulatórias, conteúdo, concorrentes e melhorias de processo. Ele nunca raspa uma plataforma proibida, ignora termos de uso, usa credencial encontrada na internet ou integra automaticamente algo que possa alterar caixa, cliente, anúncio, contrato ou dado pessoal.

A integração somente passa a produção quando houver fonte oficial, licença compatível, teste isolado, revisão de segurança, cálculo de custo e aprovação registrada. O resultado esperado é um cartão na gestão, não uma promessa de melhoria automática.

## Tokens delegados

O dono cria um token de acesso com nome, pessoa, escopos mínimos, validade, limite de usos e ambiente. O sistema exibe o segredo apenas uma vez, grava somente o hash e permite revogar imediatamente. O token deve ser apresentado como `Authorization: Bearer <token>` e validado no backend contra hash, expiração, status, escopo e contagem de uso.

A senha do dono nunca é armazenada nem usada como token. A confirmação do dono ocorre por sessão autenticada, MFA/passkey ou reautorização oficial do provedor. A criação, rotação, revogação e uso são eventos auditáveis sem registrar o segredo bruto.

A demo está em `acesso/index.html` e `inteligencia/minerador.html`. Ela usa armazenamento local apenas para simular o fluxo e não deve receber dados reais. Para produção, mover a emissão e a validação para uma Edge Function/API com segredo no cofre do provedor, RLS, rate limit, CSRF/origin checks e logs redigidos.

## Alertas

Falhas de fonte, token expirado, uso acima do limite ou tentativa de escopo não autorizado abrem alerta na plataforma. Estados críticos podem preparar uma mensagem aos sócios pelo WhatsApp oficial, sem incluir segredo. O envio precisa seguir opt-in e o recibo da API deve ser registrado.
