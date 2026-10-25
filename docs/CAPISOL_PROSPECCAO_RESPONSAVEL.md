# CAPISOL — Motor de prospecção responsável

## Objetivo

Gerar oportunidades B2B no Acre com eficiência, sem transformar a CAPISOL em uma origem de spam, sem burlar limites de WhatsApp e sem operar listas de contatos sem base documentada.

## Fluxo

1. Pesquisar empresas por fonte autorizada, como Google Places API.
2. Registrar empresa, telefone, origem, cidade, segmento e evidência do sinal comercial.
3. Classificar o lead no CRM.
4. Registrar opt-in de WhatsApp ou base documentada de contato conforme orientação jurídica aplicável.
5. Verificar supressão, opt-out, resposta anterior, cooldown e limite diário.
6. Gerar uma mensagem curta e contextualizada com instrução `SAIR`.
7. Exigir aprovação humana no primeiro contato.
8. Enfileirar no gateway oficial.
9. Parar imediatamente em resposta negativa, pedido de saída, denúncia, bounce ou erro do provedor.
10. Entregar respostas positivas a um humano e nunca fechar contrato sem validação humana.

## Travas implementadas

- Sem telefone válido: bloqueia.
- Sem opt-in ou base documentada: bloqueia.
- Fonte não confiável ou lista comprada não verificada: bloqueia.
- Opt-out ou supressão: bloqueia.
- Resposta recebida: sai da cadência automática e vai para atendimento humano.
- Uma tentativa sem resposta: para a sequência automática.
- Cooldown padrão: 7 dias.
- Limite diário padrão: 20 mensagens por gateway.
- Primeiro toque: aprovação humana obrigatória.
- Mensagem: inclui saída `SAIR`.

Os limites são conservadores e devem ser ajustados com revisão jurídica e dados reais de qualidade, não por tentativa de escapar de bloqueios.

## O que não será feito

- Minerar ou roubar tokens/API keys.
- Bypassar verificação, banimento, rate limit ou políticas de provedor.
- Usar WhatsApp pessoal ou automação não oficial em loop.
- Comprar listas e disparar para números sem base documentada.
- Enviar mensagens automaticamente só porque um telefone foi encontrado no Google Maps.
- Prometer fechamento automático ou autonomia para negociar contratos sem alçada.

## Estado atual

O motor de avaliação e a rota `/v1/outreach/evaluate` e `/v1/outreach/queue` foram adicionados ao gateway. O envio real continua bloqueado até que exista canal WhatsApp Business Platform/Respond.io conectado e os campos de consentimento/base estejam preenchidos no CRM.

Este documento é de operação; não substitui orientação jurídica sobre LGPD, regras da Meta ou políticas do provedor.
