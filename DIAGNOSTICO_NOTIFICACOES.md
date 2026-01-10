# Guia de Diagnóstico e Correção do Sistema de Notificações

## 🔍 Passo 1: Verificar Logs no Console do Navegador

Abra o console do navegador (F12) e procure por mensagens com os seguintes prefixos:
- 🔔 [Notifications] - Logs do sistema de notificações em tempo real
- 📤 [Notifications] - Logs de envio de notificações

### O que você deve ver:
1. Ao fazer login:
   ```
   🔔 [Notifications] Setting up realtime subscription for user: [UUID]
   🔔 [Notifications] Subscription status: SUBSCRIBED
   ```

2. Ao criar uma notificação (ex: criar uma academia):
   ```
   📤 [Notifications] Sending notification: {userId: "...", message: "..."}
   📤 [Notifications] Saving to database...
   📤 [Notifications] Saved successfully: {...}
   ```

3. Ao receber uma notificação:
   ```
   🔔 [Notifications] Received realtime notification: {...}
   🔔 [Notifications] Adding to state: {...}
   ```

## 🛠️ Passo 2: Habilitar Realtime no Supabase

### Opção A: Via Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/zdtkjfljiugjvixiarka
2. Vá em **Database** → **Replication**
3. Procure pela tabela `notifications`
4. Se não estiver listada, clique em **Add Table** e selecione `notifications`
5. Certifique-se de que está marcada como **Enabled**

### Opção B: Via SQL Editor

1. Acesse: https://supabase.com/dashboard/project/zdtkjfljiugjvixiarka/sql
2. Copie e execute o script `enable_realtime.sql` que está na raiz do projeto
3. Verifique se não há erros na execução

## 🔐 Passo 3: Verificar Políticas RLS

Execute no SQL Editor:

```sql
-- Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Deve retornar 3 políticas:
-- 1. Users can view own notifications (SELECT)
-- 2. Authenticated users can insert notifications (INSERT)
-- 3. Users can update own notifications (UPDATE)
```

Se não retornar as 3 políticas, execute o script `enable_realtime.sql` completo.

## 🧪 Passo 4: Teste Manual

### Teste 1: Criar Notificação Diretamente no Banco

Execute no SQL Editor:

```sql
-- Substitua USER_ID_AQUI pelo ID do seu usuário (pode pegar no console)
INSERT INTO notifications (user_id, message, read)
VALUES ('USER_ID_AQUI', 'Teste de notificação manual', false);
```

**Resultado esperado:** A notificação deve aparecer instantaneamente no topo da tela.

### Teste 2: Criar Academia (como Admin)

1. Faça login como Admin
2. Vá em "Gerenciar Academias"
3. Crie uma nova academia
4. Verifique os logs no console

**Resultado esperado:**
- Logs de envio para todos os admins
- Notificação aparece para outros admins logados

### Teste 3: Finalizar Visita (como Vendedor)

1. Faça login como Vendedor
2. Selecione um evento e academia
3. Complete uma visita
4. Verifique os logs

**Resultado esperado:**
- Logs de envio para todos os admins
- Admins logados recebem notificação instantânea

## ❌ Problemas Comuns

### Problema: "Subscription status: CHANNEL_ERROR"
**Solução:** Realtime não está habilitado. Siga o Passo 2.

### Problema: "Error saving notification: permission denied"
**Solução:** Políticas RLS incorretas. Execute o script `enable_realtime.sql`.

### Problema: Notificação salva mas não aparece em tempo real
**Solução:** 
1. Verifique se o `user_id` está correto nos logs
2. Confirme que o Realtime está habilitado
3. Tente fazer logout e login novamente

### Problema: "Cannot read property 'id' of undefined"
**Solução:** A lista de admins/vendedores não foi carregada. Verifique:
```javascript
// No console, digite:
console.log('Admins:', admins);
console.log('Sellers:', sellers);
```

## 📊 Verificação Final

Execute no SQL Editor para ver todas as notificações:

```sql
SELECT 
  n.id,
  n.user_id,
  p.name as user_name,
  n.message,
  n.read,
  n.created_at
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 20;
```

## 🆘 Se Nada Funcionar

1. Compartilhe os logs do console (copie tudo que aparecer com 🔔 ou 📤)
2. Execute e compartilhe o resultado de:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
3. Verifique se há erros na aba Network do DevTools ao criar notificações
