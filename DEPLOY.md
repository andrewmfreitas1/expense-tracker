# 🚀 Deploy Gratuito - Expense Tracker

Este guia explica como colocar seu aplicativo online **100% GRATUITO** usando Vercel e PostgreSQL.

## 📋 Pré-requisitos

- Conta no GitHub (gratuita)
- Conta na Vercel (gratuita) 
- Conta no Neon (PostgreSQL gratuito)

## 🎯 Opções de Hospedagem Gratuita

### ✅ **Recomendado: Vercel + Neon PostgreSQL**

**Por que Vercel?**
- Criada pelos criadores do Next.js
- Deploy automático a cada commit
- HTTPS e CDN inclusos
- Domínio gratuito (.vercel.app)
- 100GB de banda por mês no plano gratuito

**Por que Neon?**
- PostgreSQL totalmente gerenciado
- 512 MB de armazenamento gratuito
- Branching de banco de dados
- Sem necessidade de cartão de crédito

---

## 📝 Passo a Passo Completo

### Etapa 1: Criar Conta no GitHub (se não tiver)

1. Acesse: https://github.com/signup
2. Crie sua conta gratuita

### Etapa 2: Subir Código para o GitHub

1. **Inicialize o Git no projeto**
   ```bash
   cd c:\repo\pessoal
   git init
   git add .
   git commit -m "Initial commit - Expense Tracker"
   ```

2. **Crie um repositório no GitHub**
   - Acesse: https://github.com/new
   - Nome: `expense-tracker`
   - Deixe como **Público** ou **Privado**
   - **NÃO** marque "Add README" (já temos)
   - Clique em "Create repository"

3. **Conecte e envie o código**
   ```bash
   git remote add origin https://github.com/andrewmfreitas1/expense-tracker.git
   git branch -M main
   git push -u origin main
   ```

### Etapa 3: Criar Banco de Dados PostgreSQL Gratuito

**Opção A: Neon (Recomendado)**

1. **Crie conta**: https://neon.tech
2. **Crie um novo projeto**
   - Nome: `expense-tracker`
   - Região: escolha a mais próxima
   - PostgreSQL version: 15+
3. **Copie a Connection String**
   - Formato: `postgresql://usuario:senha@host/database?sslmode=require`
   - **Guarde essa URL!** Você vai precisar

**Opção B: Vercel Postgres**

1. Acesse: https://vercel.com/storage
2. Crie um banco Postgres
3. Copie a `DATABASE_URL`

**Opção C: Supabase**

1. Acesse: https://supabase.com
2. Crie novo projeto
3. Em Settings > Database, copie a Connection String

### Etapa 4: Deploy na Vercel

1. **Crie conta na Vercel**
   - Acesse: https://vercel.com/signup
   - Escolha "Continue with GitHub"
   - Autorize a Vercel a acessar seus repositórios

2. **Importe o projeto**
   - Clique em "Add New Project"
   - Selecione `expense-tracker` da lista
   - Clique em "Import"

3. **Configure as variáveis de ambiente**
   - Na seção "Environment Variables", adicione:
   
   ```
   Nome: DATABASE_URL
   Valor: [Cole a URL do PostgreSQL que você copiou]
   ```

   Exemplo:
   ```
   DATABASE_URL=postgresql://usuario:senha@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

4. **Configure o Build**
   - Framework Preset: Next.js (já detectado automaticamente)
   - Build Command: `npm run build` (padrão)
   - Output Directory: `.next` (padrão)

5. **Deploy!**
   - Clique em "Deploy"
   - Aguarde 2-5 minutos
   - Seu app estará online! 🎉

### Etapa 5: Configurar o Banco de Dados

Após o primeiro deploy, você precisa criar as tabelas:

1. **No painel da Vercel**
   - Vá em seu projeto
   - Clique na aba "Settings"
   - Role até "Environment Variables"

2. **Execute as migrations**
   
   **Opção A: Via Vercel CLI (Recomendado)**
   ```bash
   # Instale a CLI da Vercel
   npm i -g vercel
   
   # Faça login
   vercel login
   
   # Puxe as variáveis de ambiente
   vercel env pull .env
   
   # Execute as migrations
   npx prisma migrate deploy
   ```

   **Opção B: Via Neon Dashboard**
   - Acesse o dashboard do Neon
   - Vá em "SQL Editor"
   - Execute o SQL gerado pelo Prisma manualmente

   **Opção C: Via Prisma Studio (Local)**
   ```bash
   # Configure a URL do banco localmente
   echo "DATABASE_URL=sua-url-postgresql" > .env
   
   # Execute as migrations
   npx prisma migrate deploy
   ```

---

## 🌐 Acessar Aplicação Online

Após o deploy, sua aplicação estará disponível em:

```
https://expense-tracker-andrewmfreitas1.vercel.app
```

(ou similar - a Vercel fornecerá o link exato na página de sucesso do deploy)

## 🔄 Atualizações Automáticas

A partir de agora, **qualquer alteração** que você fizer e enviar para o GitHub será automaticamente deployada:

```bash
# Faça suas alterações
git add .
git commit -m "Descrição da alteração"
git push

# Deploy automático acontece! 🚀
```

## 📊 Limites do Plano Gratuito

### Vercel (Hobby)
- ✅ 100GB de banda/mês
- ✅ Domínios ilimitados
- ✅ HTTPS automático
- ✅ Builds ilimitados
- ✅ Serverless Functions: 100GB-Hrs/mês

### Neon PostgreSQL (Free)
- ✅ 512 MB de armazenamento
- ✅ 1 projeto
- ✅ 10 branches
- ✅ Sem limite de queries

**Para uso pessoal, isso é mais que suficiente!**

---

## 🎨 Domínio Personalizado (Opcional)

Se quiser usar seu próprio domínio:

1. **Compre um domínio** (pode ser gratuito em alguns lugares)
   - Freenom: domínios .tk, .ml, .ga gratuitos
   - Ou compre em Registro.br, Hostinger, etc.

2. **Configure na Vercel**
   - Vá em Settings > Domains
   - Adicione seu domínio
   - Configure os DNS conforme instruções

---

## � Configurar GitHub Actions (CI/CD Automático)

Se você quer que os testes rodem automaticamente e o deploy seja feito via GitHub Actions:

### 1. Obter Tokens da Vercel

1. **Acesse**: https://vercel.com/account/tokens
2. **Crie um novo token**
   - Nome: `GitHub Actions`
   - Scope: Full Account
   - Clique em "Create"
   - **COPIE O TOKEN** (só aparece uma vez!)

### 2. Obter IDs do Projeto Vercel

Após criar o projeto na Vercel:

1. **Via Vercel Dashboard**:
   - Acesse seu projeto na Vercel
   - Vá em Settings > General
   - Copie:
     - **Project ID** (no final da página)
     - **Team/Org ID** (se aplicável)

2. **Via Vercel CLI** (alternativa):
   ```bash
   # Instale a CLI
   npm i -g vercel
   
   # Faça login
   vercel login
   
   # Link o projeto
   vercel link
   
   # Veja os IDs
   cat .vercel/project.json
   ```

### 3. Adicionar Secrets no GitHub

1. **Acesse seu repositório no GitHub**
   - URL: https://github.com/SEU-USUARIO/expense-tracker

2. **Vá em Settings > Secrets and variables > Actions**

3. **Clique em "New repository secret"** e adicione:

   **Secret 1:**
   - Name: `VERCEL_TOKEN`
   - Value: [Cole o token que você criou]

   **Secret 2:**
   - Name: `VERCEL_ORG_ID`
   - Value: [Cole o Organization ID da Vercel]

   **Secret 3:**
   - Name: `VERCEL_PROJECT_ID`
   - Value: [Cole o Project ID da Vercel]

   **Secret 4:**
   - Name: `DATABASE_URL`
   - Value: [Cole a URL do PostgreSQL]

### 4. Verificar Workflows

Os workflows já estão configurados em `.github/workflows/`:
- `tests.yml` - Roda testes em cada PR
- `deploy.yml` - Roda testes e faz deploy em cada push para main
- `pr-check.yml` - Valida PRs antes do merge

### 5. Testar o CI/CD

Faça um push para testar:
```bash
git add .
git commit -m "Test CI/CD"
git push
```

Acompanhe em: https://github.com/SEU-USUARIO/expense-tracker/actions

---

## �🔧 Troubleshooting

### ❌ Erro: "Module not found"
**Solução**: Certifique-se que `postinstall` está no package.json:
```json
"postinstall": "prisma generate"
```

### ❌ Erro de conexão com banco de dados
**Solução**: Verifique se:
1. A `DATABASE_URL` está correta nas variáveis de ambiente da Vercel
2. A URL inclui `?sslmode=require` no final
3. O banco de dados está ativo no Neon

### ❌ Erro ao fazer upload de arquivos
**Solução**: Vercel usa sistema de arquivos efêmero. Para produção, você precisa usar:
- Vercel Blob Storage (gratuito até 1GB)
- Cloudinary (gratuito até 25GB)
- AWS S3 (com camada gratuita)

Para adicionar Vercel Blob:
```bash
npm install @vercel/blob
```

### ❌ Build falha
**Solução**: Verifique os logs do build na Vercel e corrija erros TypeScript

---

## 📱 Recursos Adicionais

### Monitoramento e Analytics

**Vercel Analytics (Gratuito)**
1. Vá em seu projeto na Vercel
2. Clique em "Analytics"
3. Ative o Analytics gratuito
4. Veja métricas de acesso e performance

### Banco de Dados Visual

**Acesse seus dados online:**
```bash
# No terminal local
npx prisma studio
```

Ou use o Neon Console para visualizar dados diretamente.

---

## 🔐 Segurança

1. **Nunca commite o arquivo `.env`**
   - Já está no `.gitignore`

2. **Rotacione senhas periodicamente**
   - No Neon: Settings > Reset Password

3. **Use variáveis de ambiente para secrets**
   - Sempre configure na Vercel, nunca no código

---

## 📋 Checklist Final

- [ ] Código no GitHub
- [ ] Banco de dados PostgreSQL criado (Neon/Vercel/Supabase)
- [ ] Projeto importado na Vercel
- [ ] `DATABASE_URL` configurada nas Environment Variables
- [ ] Deploy realizado com sucesso
- [ ] Migrations executadas
- [ ] Aplicação acessível online
- [ ] Testado upload de arquivo
- [ ] Testado dashboard e gráficos

---

## 🎉 Parabéns!

Seu aplicativo está online e acessível para qualquer pessoa com o link!

**Próximos passos sugeridos:**
- Adicionar autenticação (NextAuth + Google/GitHub)
- Configurar storage para uploads (Vercel Blob)
- Adicionar domínio personalizado
- Compartilhar com amigos e familiares

---

## 🆘 Precisa de Ajuda?

- **Documentação Vercel**: https://vercel.com/docs
- **Documentação Neon**: https://neon.tech/docs
- **Documentação Prisma**: https://www.prisma.io/docs
- **Documentação Next.js**: https://nextjs.org/docs

---

**Desenvolvido com ❤️ - Deploy facilitado pela Vercel**
