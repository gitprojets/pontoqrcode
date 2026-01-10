# Guia de Migração - FrequênciaQR

Este guia explica como migrar o projeto completo para um Supabase externo.

## 📦 O Que Será Migrado

### 1. Schema do Banco de Dados
- 18 tabelas principais
- 79+ políticas RLS
- 20+ funções de banco
- Triggers e índices

### 2. Dados
- Todos os registros de todas as tabelas
- Relacionamentos preservados

### 3. Storage
- Bucket `justificativas` (arquivos anexos)

### 4. Secrets Necessários
- `QR_JWT_SECRET` - Chave para tokens JWT do QR Code
- `RESEND_API_KEY` - API do Resend para emails
- `VAPID_PUBLIC_KEY` - Chave pública para push notifications
- `VAPID_PRIVATE_KEY` - Chave privada para push notifications

### 5. Edge Functions
- `create-user` - Criação de usuários
- `export-database` - Exportação de dados
- `generate-qr-token` - Geração de tokens QR
- `get-public-stats` - Estatísticas públicas
- `rotate-api-keys` - Rotação de chaves API
- `seed-demo-data` - Dados de demonstração
- `send-notification-email` - Envio de emails
- `send-push-notification` - Push notifications
- `setup-initial-user` - Setup inicial
- `validate-qr-token` - Validação de tokens

---

## 🚀 Passo a Passo da Migração

### Passo 1: Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon Key**: `eyJ...`
   - **Service Role Key**: `eyJ...`

### Passo 2: Executar Migrações

Copie todos os arquivos de `supabase/migrations/` e execute no SQL Editor do Supabase, **em ordem cronológica** (pelo timestamp do nome do arquivo).

Exemplo de ordem:
```
20240101000000_initial_schema.sql
20240102000000_add_tables.sql
...
```

### Passo 3: Configurar Secrets

No Supabase Dashboard, vá em **Settings > Edge Functions > Secrets** e configure:

```bash
QR_JWT_SECRET=sua_chave_secreta_jwt_32_caracteres
RESEND_API_KEY=re_xxxxx
VAPID_PUBLIC_KEY=BPxx...
VAPID_PRIVATE_KEY=xxx...
```

### Passo 4: Importar Dados

1. Use a Edge Function `export-database` para exportar dados:
```bash
curl -X POST https://ygangoaqopfqagyzijrk.supabase.co/functions/v1/export-database \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

2. Salve o JSON retornado
3. Use o SQL Editor para inserir os dados no novo projeto

### Passo 5: Configurar Storage

1. Crie o bucket `justificativas`:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('justificativas', 'justificativas', false);
```

2. Configure as políticas de storage (veja as migrations)

### Passo 6: Configurar Auth

No Supabase Dashboard, vá em **Authentication > Settings**:

- ✅ Enable email confirmations: **OFF** (auto-confirm)
- ✅ Disable signups: **OFF**
- ✅ Enable anonymous sign-ins: **OFF**

### Passo 7: Deploy das Edge Functions

Use o Supabase CLI:

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Deploy de todas as functions
supabase functions deploy
```

### Passo 8: Atualizar Variáveis no Frontend

Atualize o `.env` do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...sua_anon_key
VITE_SUPABASE_PROJECT_ID=seu_project_id
```

---

## 📋 Checklist de Verificação

- [ ] Migrações executadas sem erros
- [ ] Dados importados corretamente
- [ ] Secrets configurados
- [ ] Storage bucket criado
- [ ] Políticas de storage configuradas
- [ ] Auth settings configurados
- [ ] Edge Functions deployed
- [ ] Variáveis de ambiente atualizadas
- [ ] Teste de login funcionando
- [ ] Teste de registro de frequência funcionando
- [ ] Teste de QR Code funcionando

---

## 🔐 Segurança

### Secrets que Você Precisa Gerar

1. **QR_JWT_SECRET**: Gere uma chave aleatória:
   ```bash
   openssl rand -base64 32
   ```

2. **VAPID Keys**: Gere um par de chaves:
   ```bash
   npx web-push generate-vapid-keys
   ```

3. **RESEND_API_KEY**: Obtenha em [resend.com](https://resend.com)

---

## 📞 Suporte

Se encontrar problemas durante a migração, verifique:
1. Logs de erro no Supabase Dashboard
2. Ordem correta das migrações
3. Todas as foreign keys e constraints

---

## 📊 Estrutura das Tabelas

| Tabela | Descrição | Registros Típicos |
|--------|-----------|-------------------|
| profiles | Perfis de usuários | 50-500 |
| user_roles | Papéis dos usuários | 50-500 |
| unidades | Escolas/unidades | 5-50 |
| admin_unidades | Relação admin-unidade | 10-100 |
| dispositivos | Leitores QR | 10-100 |
| dispositivo_api_keys | Chaves dos dispositivos | 10-100 |
| registros_frequencia | Registros de ponto | 1000-100000 |
| escalas_trabalho | Escalas de trabalho | 100-1000 |
| justificativas | Justificativas de falta | 50-500 |
| attendance_rules | Regras de frequência | 5-50 |
| school_events | Eventos escolares | 20-200 |
| qr_nonces | Nonces de QR (temporário) | 0-100 |
| push_subscriptions | Assinaturas push | 50-500 |
| notification_logs | Logs de notificação | 100-10000 |
| email_notifications | Emails enviados | 100-10000 |
| support_tickets | Tickets de suporte | 10-100 |
| audit_logs | Logs de auditoria | 1000-100000 |
| user_settings | Configurações do usuário | 50-500 |
