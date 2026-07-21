# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Notas Técnicas Importantes

### 1. Produção vs. Desenvolvimento (Firebase Studio)
Para que o login e o redirecionamento de senha funcionem no ambiente de produção, o domínio da aplicação (ex: `[project-id].web.app` ou domínios customizados) **deve** ser adicionado à lista de "Domínios autorizados" nas configurações do Firebase Authentication no Console do Firebase.

### 2. Limitação Conhecida: Fluxo de Redefinição de Senha no Studio
No ambiente de desenvolvimento do Firebase Studio (Cloud Workstations), pode ocorrer um erro **401 (PERMISSION_DENIED)** em `Workstations.GenerateAccessToken` após a conclusão bem-sucedida de um reset de senha.

**Diagnóstico:**
- Este erro é causado por restrições de permissão na infraestrutura do Google Cloud Workstations e **não ocorre em produção**.
- O fluxo de recuperação de senha (envio de e-mail, validação de token e alteração de senha) é processado corretamente pelo Firebase Auth.
- O erro ocorre apenas no redirecionamento final para o servidor do Studio, que falha ao tentar inicializar o Admin SDK no contexto da estação de trabalho.

**Ação:** Ignore o erro 401 no Studio após a tela de sucesso do reset. Em produção (Firebase App Hosting), o redirecionamento para o `/login` funcionará perfeitamente, pois o ambiente terá as credenciais de serviço nativas.

### 3. Configurações de E-mail
Certifique-se de configurar o template de e-mail e o provedor SMTP no console do Firebase para que os links de redefinição de senha cheguem aos usuários.
