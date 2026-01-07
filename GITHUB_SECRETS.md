# 🔐 Configurar GitHub Secrets - Guia Rápido

## ❌ Erro Atual

```
Error: Input required and not supplied: vercel-token
```

## ✅ Solução: Adicionar 4 Secrets no GitHub

### Passo 1: Obter VERCEL_TOKEN

1. **Acesse**: https://vercel.com/account/tokens
2. **Clique em "Create Token"**
3. **Configure**:
   - Token Name: `GitHub Actions CI/CD`
   - Scope: `Full Account`
   - Expiration: `No Expiration` (ou escolha um prazo)
4. **Clique em "Create"**
5. **⚠️ COPIE O TOKEN AGORA** (só aparece uma vez!)

### Passo 2: Obter VERCEL_ORG_ID e VERCEL_PROJECT_ID

**Opção A: Via Vercel Dashboard (Recomendado)**

1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto `expense-tracker`
3. Vá em **Settings** > **General**
4. Role até o final da página
5. Copie:
   - **Project ID** (ex: `prj_abc123xyz`)
   - **Team/Org ID** ou deixe vazio se for pessoal

**Opção B: Via CLI da Vercel**

```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Link o projeto (responda as perguntas)
vercel link

# Ver os IDs
cat .vercel/project.json
```

O arquivo mostrará algo como:
```json
{
  "orgId": "team_abc123",
  "projectId": "prj_xyz789"
}
```

### Passo 3: Obter DATABASE_URL

A URL do PostgreSQL que você já configurou na Vercel. Formato:

```
postgresql://usuario:senha@host.neon.tech/database?sslmode=require
```

Se não lembra, veja em:
- **Neon**: https://console.neon.tech > Seu projeto > Connection string
- **Vercel Postgres**: Dashboard > Storage > Postgres > .env.local
- **Supabase**: Dashboard > Settings > Database > Connection string

### Passo 4: Adicionar Secrets no GitHub

1. **Acesse seu repositório**:
   ```
   https://github.com/andrewmfreitas1/expense-tracker
   ```

2. **Vá para Settings** (menu superior direito)

3. **No menu lateral esquerdo**:
   - Clique em **Secrets and variables**
   - Clique em **Actions**

4. **Adicione cada secret** clicando em "New repository secret":

   | Nome | Valor | Onde Pegar |
   |------|-------|------------|
   | `VERCEL_TOKEN` | `vtb_xxxxx...` | Passo 1 acima |
   | `VERCEL_ORG_ID` | `team_xxxxx` | Passo 2 acima |
   | `VERCEL_PROJECT_ID` | `prj_xxxxx` | Passo 2 acima |
   | `DATABASE_URL` | `postgresql://...` | Passo 3 acima |

### Passo 5: Verificar

Após adicionar todos os secrets:

1. **Vá para Actions**: https://github.com/andrewmfreitas1/expense-tracker/actions
2. **Clique no workflow que falhou**
3. **Clique em "Re-run all jobs"**

Ou faça um novo commit:
```bash
git commit --allow-empty -m "Test GitHub Actions with secrets"
git push
```

---

## 📋 Checklist

- [ ] VERCEL_TOKEN criado e adicionado
- [ ] VERCEL_ORG_ID adicionado
- [ ] VERCEL_PROJECT_ID adicionado
- [ ] DATABASE_URL adicionado
- [ ] Workflow re-executado ou novo push feito
- [ ] Deploy funcionando ✅

---

## 🔍 Como Verificar se Está Funcionando

1. Acesse: https://github.com/andrewmfreitas1/expense-tracker/actions
2. Veja o último workflow rodando
3. Deve mostrar:
   - ✅ Run Tests
   - ✅ Build Application
   - ✅ Deploy to Vercel

---

## ⚠️ Importante

- **NUNCA** compartilhe esses tokens publicamente
- **NÃO** comite os secrets no código
- Os secrets ficam criptografados no GitHub
- Você pode rotacionar o VERCEL_TOKEN a qualquer momento em: https://vercel.com/account/tokens

---

## 🆘 Ainda com Problemas?

Se após configurar tudo ainda der erro:

1. **Verifique os nomes** - devem ser exatamente:
   - `VERCEL_TOKEN` (não `VERCEL-TOKEN` ou `vercel_token`)
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `DATABASE_URL`

2. **Verifique os valores**:
   - Sem espaços antes/depois
   - Token completo copiado
   - IDs corretos do projeto

3. **Re-crie o token** se necessário:
   - Delete o antigo em https://vercel.com/account/tokens
   - Crie um novo
   - Atualize o secret no GitHub
