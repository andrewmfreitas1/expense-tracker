# 🚀 Configuração do Vercel - Passo a Passo

## ⚠️ ATENÇÃO: Configure as Variáveis de Ambiente ANTES de usar a aplicação!

Seu deploy foi bem-sucedido, mas a aplicação precisa das variáveis de ambiente configuradas para funcionar.

---

## 📋 Passo a Passo

### 1. Acesse as Configurações do Projeto no Vercel

1. Vá para: https://vercel.com/dashboard
2. Clique no seu projeto **expense-tracker**
3. Clique na aba **Settings** (Configurações)
4. No menu lateral, clique em **Environment Variables**

### 2. Adicione as Variáveis de Ambiente

Adicione **TODAS** as variáveis abaixo:

#### **DATABASE_URL**
```
Nome: DATABASE_URL
Valor: Sua URL do PostgreSQL (Neon, Vercel Postgres, ou outro)
Ambiente: Production, Preview, Development (marque todos)
```

**Exemplo de URL do Neon:**
```
postgresql://usuario:senha@ep-nome-do-projeto.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Exemplo de URL do Vercel Postgres:**
```
postgres://default:senha@host-do-vercel.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require
```

#### **NEXTAUTH_URL**
```
Nome: NEXTAUTH_URL
Valor: https://seu-projeto.vercel.app
Ambiente: Production, Preview, Development
```

⚠️ **IMPORTANTE**: Use a URL real do seu deploy (sem barra no final)

Exemplo:
```
https://expense-tracker-kappa.vercel.app
```

#### **NEXTAUTH_SECRET**
```
Nome: NEXTAUTH_SECRET
Valor: Uma string aleatória segura
Ambiente: Production, Preview, Development
```

**Como gerar a secret:**

**No Windows (PowerShell):**
```powershell
# Opção 1: Usando openssl (se instalado)
openssl rand -base64 32

# Opção 2: Sem openssl
-join ((1..32) | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 126) })
```

**Online (mais fácil):**
- Acesse: https://generate-secret.vercel.app/32
- Copie o valor gerado

---

### 3. Salvar e Redeployer

Depois de adicionar as 3 variáveis:

1. Clique em **Save** em cada uma
2. Vá para a aba **Deployments**
3. Clique nos **três pontinhos** do último deployment
4. Clique em **Redeploy**
5. Confirme **Redeploy**

---

### 4. Aplicar Migrações do Banco de Dados

**IMPORTANTE:** Após configurar as variáveis, você precisa aplicar as migrações no banco de dados de produção.

#### Opção 1: Via Terminal Local (Recomendado)

No terminal do VS Code:

```powershell
# Configure temporariamente a DATABASE_URL de produção
$env:DATABASE_URL="postgresql://usuario:senha@host/database?sslmode=require"

# Aplique as migrações
npm run prisma:migrate:deploy

# Limpe a variável (opcional)
Remove-Item Env:\DATABASE_URL
```

⚠️ **Substitua a URL** pela conexão PostgreSQL do Neon ou Vercel Postgres (copie do dashboard da Vercel).

#### Opção 2: Via Vercel CLI

```powershell
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Login
vercel login

# Executar migração
vercel env pull .env.production
npx prisma migrate deploy
```

#### O que as migrações fazem:
- Criam as tabelas: User, Account, Session, VerificationToken, Expense
- Adicionam índices para performance
- Configuram relacionamentos e constraints

---

## 🎯 Como Usar a Aplicação Após Deploy

### Primeira Vez:

1. ✅ Configure as variáveis de ambiente
2. ✅ Aplique as migrações do banco (`npm run prisma:migrate:deploy`)
3. Acesse: `https://seu-projeto.vercel.app/login`
4. Clique em **"Criar Conta"**
5. Preencha:
   - Nome
   - Email
   - Senha (mínimo 6 caracteres)
6. Clique em **Criar Conta**
7. Você será logado automaticamente

### Próximos Acessos:

1. Acesse: `https://seu-projeto.vercel.app/login`
2. Use seu email e senha
3. Clique em **Entrar**

---

## 🔍 Verificando se Está Funcionando

Após configurar as variáveis e redeployer:

✅ **Deve funcionar:**
- Página de login acessível
- Criar conta
- Fazer login
- Acessar dashboard, despesas, upload
- Fazer logout

❌ **Se ainda der erro:**
1. Verifique se as 3 variáveis estão salvas
2. Verifique se DATABASE_URL está correta (teste a conexão no Neon/Vercel)
3. Verifique se NEXTAUTH_URL tem o domínio correto (sem barra no final)
4. Redeploye novamente

---

## 🗄️ Banco de Dados

### Opção 1: Neon (Recomendado - Mais Fácil)

1. Acesse: https://neon.tech
2. Faça login com GitHub
3. Crie um novo projeto
4. Copie a **Connection String**
5. Cole como valor de `DATABASE_URL` no Vercel

### Opção 2: Vercel Postgres (Integrado)

1. No projeto do Vercel, vá em **Storage**
2. Clique em **Create Database**
3. Escolha **Postgres**
4. Siga as instruções
5. A variável `DATABASE_URL` será adicionada automaticamente

---

## 🐛 Solução de Problemas

### Erro: "NO_SECRET"
**Causa:** NEXTAUTH_SECRET não configurado
**Solução:** Adicione a variável e redeploye

### Erro: "Database connection failed"
**Causa:** DATABASE_URL incorreto ou banco inacessível
**Solução:** 
- Verifique a URL no painel do Neon/Vercel
- Teste a conexão
- Certifique-se que tem `?sslmode=require` no final

### Erro: "Invalid URL"
**Causa:** NEXTAUTH_URL com formato errado
**Solução:** Use formato: `https://dominio.vercel.app` (sem barra no final)

### Página em branco ou loop infinito
**Causa:** Variáveis não configuradas ou middleware redirecionando incorretamente
**Solução:** 
- Configure todas as variáveis
- Redeploye
- Acesse `/login` diretamente

---

## 📝 Checklist Final

Antes de considerar o deploy completo:

- [ ] DATABASE_URL configurado no Vercel
- [ ] NEXTAUTH_URL configurado com domínio correto
- [ ] NEXTAUTH_SECRET gerado e configurado
- [ ] Redeployment feito após adicionar variáveis
- [ ] Consegue acessar `/login`
- [ ] Consegue criar conta
- [ ] Consegue fazer login
- [ ] Rotas protegidas redirecionam para login quando não autenticado
- [ ] Dados são salvos no banco (teste criar uma despesa)

---

## 🎉 Pronto!

Após seguir todos os passos, sua aplicação estará 100% funcional online!

**URL da sua aplicação:** `https://seu-projeto.vercel.app`
