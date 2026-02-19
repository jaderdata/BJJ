# Regras do Sistema - BJJ Visits

Este documento descreve todas as regras de negócio, segurança, banco de dados e restrições do sistema BJJ Visits.

---

## 1. Gestão de Acesso e Autenticação

O sistema utiliza um fluxo de autenticação customizado baseado em **Allowlist** (Lista de Permissões) e **RPCs** (Remote Procedure Calls) no Supabase.

### Regras de Cadastro
*   **Allowlist Obrigatória**: Apenas e-mails previamente cadastrados na tabela `app_allowlist` podem solicitar acesso ou ativar contas.
*   **Ativação de Conta**: Ao solicitar acesso, o sistema envia um token de ativação (válido por 60 minutos). O usuário deve fornecer Nome e Senha para criar seu perfil em `app_users`.
*   **Papéis (Roles)**: 
    *   `ADMIN`: Acesso total ao dashboard, gestão de academias, eventos, financeiro e usuários.
    *   `SALES`: Acesso às rotas de visita, registro de dados e visualização de seus próprios indicadores.
*   **Status de Usuário**: 
    *   `ACTIVE`: Acesso permitido.
    *   `INACTIVE`: Acesso bloqueado (ignorado pelo RPC de login).

### Segurança de Credenciais
*   As senhas são criptografadas usando a extensão `pgcrypto` (`crypt` com `bf`).
*   O login é processado exclusivamente via RPC `auth_login` para evitar exposição de tabelas de credenciais.

---

## 2. Segurança e Row Level Security (RLS)

O sistema implementa **Hardening de Banco de Dados** para garantir que dados sensíveis não sejam acessados diretamente pelo cliente Supabase.

### Políticas Principais
*   **app_users**: O acesso público via SELECT foi removido. A leitura de perfis ocorre apenas através da função `get_profile` definida com `SECURITY DEFINER`.
*   **vendor_details**: 
    *   Admins têm acesso total.
    *   Vendedores podem ler, inserir e atualizar apenas seus próprios dados.
*   **notifications**: Usuários podem ler e atualizar (marcar como lida) apenas suas próprias notificações.

---

## 3. Sistema de Elevação de Privilégios (Admin Elevation)

Para ações críticas, o sistema exige uma elevação temporária de privilégios para usuários `ADMIN`.

*   **Sessão Temporária**: O administrador deve fornecer sua senha para elevar o nível de acesso.
*   **Duração**: Padrão de 30 minutos (configurável).
*   **Expiração**: Após o tempo limite, a sessão é automaticamente revogada.
*   **Auditoria**: Toda elevação é registrada em `admin_sessions` e ações executadas durante a sessão são logadas em `admin_audit_log`.

---

## 4. Banco de Dados e Integridade

As tabelas possuem restrições rígidas para garantir a consistência dos dados.

### Restrições (Check Constraints)
*   **app_users.role**: Deve ser `ADMIN` ou `SALES`.
*   **app_users.status**: Deve ser `ACTIVE` ou `INACTIVE`.
*   **auth_tokens.type**: Deve ser `ACTIVATION` ou `RESET`.
*   **visits.status**: `Pendente` ou `Visitada`.

### Relacionamentos e Integridade
*   **Visitas e Vouchers**: A exclusão de uma visita ou evento deve considerar a exclusão em cascata ou limpeza manual de vouchers associados para evitar dados órfãos.
*   **Unicidade**: Existe uma restrição de unicidade para o par `(event_id, academy_id)` na tabela de visitas, garantindo que não haja duas visitas registradas para a mesma academia no mesmo evento.

---

## 5. Regras de Negócio e Estados

### Fluxo de Eventos
1.  `A acontecer`: Evento planejado, aguardando início.
2.  `Em andamento`: Evento ocorrendo no momento.
3.  `Concluído`: Evento finalizado.

### Fluxo de Visitas
1.  **Início**: O vendedor inicia a visita (registro de `started_at`).
2.  **Dados da Visita**: Coleta de temperatura da academia (`Frio`, `Morno`, `Quente`), pessoa de contato, notas e fotos.
3.  **Finalização**: Geração de vouchers e registro de `finished_at`. O status muda para `Visitada`.

### Gestão de Vouchers
*   Vouchers são gerados durante a visita.
*   O sistema sincroniza automaticamente os códigos de vouchers com a tabela `vouchers` para garantir integridade caso a contagem seja alterada antes da finalização.

---

## 6. Auditoria e Logs

O sistema mantém um rastro completo de atividades:
*   **auth_logs**: Registra tentativas de login (sucesso/falha), solicitações de reset e ativações.
*   **system_logs**: Registra ações genéricas dos usuários para fins de suporte.
*   **admin_audit_log**: Detalhamento de toda ação administrativa realizada sob privilégios elevados.

---

## 7. Impactos no Sistema

| Regra | Impacto |
|-------|---------|
| **RLS Estrito** | Impede vazamento de dados caso a chave pública do Supabase seja comprometida. |
| **Integridade de Visitas** | Garante que os relatórios de conversão e visitas sejam precisos, sem duplicidade. |
| **Expiração de Sessão Admin** | Reduz a janela de ataque caso um computador de administrador seja deixado logado. |
| **Sincronização de VOUCHER** | Previne que usuários recebam códigos que não foram formalmente registrados no banco. |
