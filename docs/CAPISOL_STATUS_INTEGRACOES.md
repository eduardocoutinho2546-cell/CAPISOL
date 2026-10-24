# CAPISOL — Status de integrações

| Integração | Estado no repositório | Próximo requisito real | Regra de segurança |
|---|---|---|---|
| Supabase | Conectado por chave pública no front-end e usado em coleções/RPCs | Revisar RLS, funções e usuários no projeto | Nunca publicar `service_role` ou segredo no navegador |
| BelEnergy | Painel de importação PDF, fila de cotação e tabela de custo existem | Configurar e validar conector autenticado da função `capisol-cotacoes` | Importar, comparar e aprovar; não comprar automaticamente |
| WhatsApp | Links e mensagens prontas; avisos por link para sócios | API oficial, opt-in, templates e webhook se houver automação | Sem disparo frio e sem token no front-end |
| Instagram/Facebook | Calendário e orientação de uso; rascunhos | Meta Business/Graph com permissões e conta conectada | Publicação só após revisão e autorização |
| TikTok/YouTube | Orientação e produção de rascunho | Contas, tokens e política de publicação | Não afirmar publicação sem recibo da plataforma |
| Banco/financiamento | Simulação e campo de consulta; taxa/CET pendentes | Parceiro bancário e simulação oficial | Não prometer aprovação ou usar taxa não confirmada |
| Nota fiscal | Jornada e campos previstos; emissão externa não comprovada | Provedor fiscal/contador e credenciais | Agente prepara; emissão exige integração e validação fiscal |
| Domínio | GitHub Pages/repositório preparado | Configuração DNS/domínio de produção | Testar HTTPS, autenticação e rotas após publicação |

Este documento evita que o painel apresente como conectado um serviço que ainda depende de credencial, webhook ou aprovação externa.
