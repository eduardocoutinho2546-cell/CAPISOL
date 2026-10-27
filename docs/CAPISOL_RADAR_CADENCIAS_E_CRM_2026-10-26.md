# CAPISOL — Rotinas obrigatórias de inteligência comercial (26/10/2026)

## Cadências
- Concorrentes: TODOS OS DIAS; observar novidades, ofertas antigas/novas e canais públicos. Não deduzir resultado comercial de anúncios públicos.
- Clientes novos: de 15 em 15 dias CORRIDOS a partir de 27/10/2026; não interpretar como dias 1 e 16 do mês.
- Parceiros: todo dia 1 de cada mês a partir de 01/11/2026.
- Eventos: TODOS OS DIAS; Rio Branco/Acre, Porto Velho/RO e energia solar/negócios nacionais conforme relevância.
- Execução manual: GitHub Actions CAPISOL radar e fontes publicas, escolha all/concorrentes/clientes/parceiros/eventos; manual ignora frequência.

## Cruzamento de clientes em duas pontes
1. Consultar Google Places por função autenticada: ver ficha temporária e guardar somente placeId (a exceção de cache autorizada), sem replicar lista ou reviews no CRM.
2. Conferir negócio em site oficial, CNPJ ou fonte empresarial independente, data e URL. Registrar imóvel próprio, alugado, de terceiros, várias unidades, sem sede ou pendente. O imóvel pode ser de terceiro; não descartar automaticamente sem sede.
3. Somente depois das DUAS fontes enviar para etapa Qualificar no CRM, sem consentimento presumido para WhatsApp ou aprovação de venda.
4. Registro Places antigo não pode ir diretamente para docs.col=leads. Primeiro registrar placeId em docs.col=places_consultas; segunda fonte em radar/verificar.html. Lead entra em docs.col=leads somente pelo radar autenticado.

## Concorrentes e redes sociais
Consulta RSS pública aponta indícios, não resultados de campanha. Conferir nas fontes oficiais páginas, criativos, ofertas, atualizações Instagram/Facebook/TikTok e Bibliotecas Meta/Google dentro de APIs e usos autorizados. Automação de RSS NÃO coleta posts de redes sociais autenticadas; constará como pendente.
Monitorar o que apareceu, se manteve e deixou de ser visto, sem supor que deixou de existir. Não inferir ROAS, CTR, CAC, leads ou vendas da concorrência. Comparar preço só com kWp, frete, instalação, homologação, garantia e CET.

## Eventos, comunicação e participação
Minerar diariamente feiras, palestras, encontros de empreendedorismo, eventos comerciais, energia solar, engenharia e oportunidades de networking. Conferir organizador, data FUTURA, inscrição, público, local e custo; sugerir participação e possibilidade de patrocínio sujeito a orçamento/aprovação.
Na primeira camada, monitor-mercado.py consulta RSS, mantém histórico e classifica sinais novos; notificar_eventos.py abre issue de revisão para novos sinais. Esse ticket depende de notificações GitHub habilitadas; NÃO é envio ao WhatsApp nem alerta push garantido. Automação de ChatGPT não foi criada por limite de cinco tarefas.

## Status técnico e limitações
GitHub Actions inicia as rotinas diariamente às 13h UTC (08h Rio Branco), com portas lógicas 15 dias/mensal. Os cron jobs podem sofrer atrasos. Publicação de notícia não equivale à data do evento. A API Places para consultas individuais já existe, mas acesso autenticado e as permissões do banco ainda precisam de teste ponta a ponta.
Links oficiais: https://developers.google.com/maps/documentation/places/web-service/policies ; https://ac.loja.sebrae.com.br/ ; https://brasilenergia.com.br/eventos
