# CAPISOL — Backup, recuperação e continuidade

## Diagnóstico atual

A demo de tokens, minerador e metas usa `localStorage`; isso fica somente no navegador do usuário, pode ser apagado, não sincroniza entre dispositivos e não é backup. O CRM e a inteligência usam Supabase quando a sessão está autenticada. O código público não contém `service_role`, o que é correto, mas não existe neste repositório um job comprovado que exporte e teste a restauração do banco.

## Destino correto

1. Dados transacionais: projeto Supabase, com RLS, migrations versionadas e exportação criptografada fora do banco.
2. Arquivos: bucket privado `arquivos`, com políticas por usuário e URLs assinadas curtas. Não usar GitHub como cofre de clientes ou anexos.
3. Código: GitHub, sem credenciais e sem dumps de clientes.
4. Backup: armazenamento S3 compatível ou provedor de backup com criptografia, retenção e chave fora do repositório. Restic é uma opção BSD-2-Clause; MinIO foi considerado, mas o repositório consultado está arquivado e não deve ser introduzido agora.
5. Logs: observabilidade separada, com redação de tokens, senhas, documentos e dados pessoais.

## Política mínima

- Backup diário incremental e semanal completo.
- Retenção: 7 diários, 4 semanais e 12 mensais, ajustada com contador e jurídico.
- RPO inicial: 24 horas. RTO inicial: 8 horas. Depois reduzir com testes reais.
- Teste de restauração mensal em ambiente separado; um backup sem restore testado não é considerado válido.
- Registrar checksum, horário UTC, tamanho, origem, resultado e responsável.
- Alertar quando houver falha, atraso, tamanho anormal ou ausência de backup.

## Recuperação

1. Bloquear escrita e registrar incidente.
2. Escolher o último backup íntegro anterior ao evento.
3. Restaurar em ambiente separado.
4. Rodar migrations, auditoria de integridade e contagem de coleções.
5. Validar leads, propostas, contratos, recebimentos, arquivos e permissões com amostras redigidas.
6. Aprovação dos sócios antes de reabrir escrita.
7. Registrar perda estimada, causa e ação preventiva.

## Não fazer

- Não guardar senha, PIN, token bruto ou `service_role` no GitHub.
- Não chamar `localStorage` de backup.
- Não fazer dump de cliente em artefato público do GitHub Pages.
- Não declarar que o backup existe enquanto o job, destino e restore não forem testados.
