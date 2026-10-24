# CAPISOL — Guardião de Acessos

## Responsabilidade

O Guardião de Acessos monitora o estado das integrações da CAPISOL sem armazenar senhas humanas. Ele verifica se uma conexão está ativa, qual é o provedor, quando o token expira, quais permissões foram concedidas, quem aprovou a conexão e qual foi o último teste bem-sucedido.

## Regra inegociável

Senhas, PINs, códigos de autenticação e tokens brutos não entram em catálogo de agentes, banco de dados, GitHub, logs, mensagens ou relatórios. O Guardião trabalha com referências seguras a segredos, como `secret_ref`, e recebe somente o resultado da validação.

## Estados

`connected` significa que a chamada oficial de teste passou. `needs_auth` significa que a autorização ainda não foi concedida. `expired` significa que o token expirou. `revoked` significa que o provedor rejeitou a autorização. `degraded` significa falha intermitente. `blocked` significa que a operação foi interrompida por segurança.

## Fluxo de alerta

1. O conector emite um evento com serviço, estado, timestamp, ambiente, escopo solicitado e identificador não secreto.
2. O Guardião valida formato, remove qualquer valor sensível, grava o evento de auditoria e abre uma pendência na plataforma.
3. A plataforma notifica o painel executivo e os responsáveis definidos.
4. Para `expired`, `revoked`, `blocked` ou falha repetida, a plataforma prepara um aviso no WhatsApp dos sócios por meio do mecanismo oficial já existente, com botão de abertura e sem envio silencioso.
5. O responsável reautoriza o conector no provedor. O Guardião testa novamente e encerra o alerta somente com evidência de sucesso.

## Mensagem de escalonamento

`CAPISOL — integração [serviço] em estado [estado]. Último teste: [data/hora]. Impacto: [impacto]. Próxima ação: reautorizar o conector pelo provedor. Nenhuma senha é solicitada ou armazenada pela plataforma.`

## Limites

O Guardião não acessa contas por senha colada em chat, não contorna MFA, não publica credenciais no GitHub, não envia mensagens sem opt-in e não declara uma integração ativa apenas porque existe um campo de configuração.

## Métricas

A gestão acompanha disponibilidade por integração, idade do último teste, tempo de recuperação, quantidade de alertas repetidos, integrações sem responsável e eventos bloqueados por tentativa de uso de segredo bruto.
